import { prisma } from '@/lib/prisma';
import { withFakeLatency } from '@/lib/fake-latency';
import { err, handleError, ok } from '@/lib/api-response';
import { EmissionFactorCreateSchema } from '@/lib/validation';

/**
 * @openapi
 * /api/emission-factors:
 *   get:
 *     summary: 배출계수 + 버전 이력 전체 조회
 *     responses:
 *       200:
 *         description: 목록
 */
export async function GET() {
  try {
    const factors = await withFakeLatency(() =>
      prisma.emissionFactor.findMany({
        orderBy: { typeKey: 'asc' },
        include: {
          type: true,
          versions: { orderBy: { version: 'asc' } },
        },
      }),
    );
    return ok(factors);
  } catch (e) {
    return handleError(e);
  }
}

/**
 * @openapi
 * /api/emission-factors:
 *   post:
 *     summary: 배출계수 생성 (첫 버전 v1 자동 등록)
 *     description: 활동 유형당 배출계수는 1개만 존재한다 (typeKey unique). 트랜잭션으로 v1까지 한 번에 만든다.
 */
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const input = EmissionFactorCreateSchema.parse(json);
    const created = await withFakeLatency(
      () =>
        prisma.$transaction(async (tx) => {
          const type = await tx.activityType.findUnique({ where: { key: input.typeKey } });
          if (!type) throw new Error('TYPE_NOT_FOUND');
          const exists = await tx.emissionFactor.findUnique({ where: { typeKey: input.typeKey } });
          if (exists) throw new Error('FACTOR_EXISTS');

          const factor = await tx.emissionFactor.create({
            data: {
              typeKey: input.typeKey,
              description: input.description,
              unit: `${input.numerator}/${input.denominator}`,
              numerator: input.numerator,
              denominator: input.denominator,
              source: input.source ?? null,
            },
          });
          await tx.factorVersion.create({
            data: {
              factorId: factor.id,
              version: 1,
              value: input.initialValue,
              validFrom: new Date(input.initialValidFrom),
              validTo: null,
              note: input.initialNote ?? null,
            },
          });
          return tx.emissionFactor.findUnique({
            where: { id: factor.id },
            include: { type: true, versions: { orderBy: { version: 'asc' } } },
          });
        }),
      { mayFail: true, opName: '배출계수 생성' },
    );
    return ok(created, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === 'TYPE_NOT_FOUND') {
      return err('TYPE_NOT_FOUND', '활동 유형이 존재하지 않습니다.', 404);
    }
    if (e instanceof Error && e.message === 'FACTOR_EXISTS') {
      return err('FACTOR_EXISTS', '해당 활동 유형의 배출계수는 이미 존재합니다.', 409);
    }
    return handleError(e);
  }
}
