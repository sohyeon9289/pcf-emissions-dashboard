import { prisma } from '@/lib/prisma';
import { withFakeLatency } from '@/lib/fake-latency';
import { err, handleError, ok } from '@/lib/api-response';
import { CompanyCreateSchema } from '@/lib/validation';

/**
 * @openapi
 * /api/companies:
 *   get:
 *     summary: 회사 목록
 *     responses:
 *       200:
 *         description: 목록
 */
export async function GET() {
  try {
    const companies = await withFakeLatency(() =>
      prisma.company.findMany({
        orderBy: { name: 'asc' },
        include: { country: true },
      }),
    );
    return ok(companies);
  } catch (e) {
    return handleError(e);
  }
}

/**
 * @openapi
 * /api/companies:
 *   post:
 *     summary: 회사 생성
 */
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const input = CompanyCreateSchema.parse(json);

    const created = await withFakeLatency(
      () =>
        prisma.$transaction(async (tx) => {
          await tx.country.upsert({
            where: { code: input.countryCode },
            create: { code: input.countryCode, name: input.countryCode },
            update: {},
          });
          const exists = await tx.company.findUnique({ where: { id: input.id } });
          if (exists) {
            throw new Error('COMPANY_EXISTS');
          }
          return tx.company.create({
            data: {
              id: input.id,
              name: input.name,
              countryCode: input.countryCode,
              description: input.description ?? null,
            },
            include: { country: true },
          });
        }),
      { mayFail: true, opName: '회사 생성' },
    );
    return ok(created, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === 'COMPANY_EXISTS') {
      return err('COMPANY_EXISTS', '같은 ID의 회사가 이미 존재합니다.', 409);
    }
    return handleError(e);
  }
}
