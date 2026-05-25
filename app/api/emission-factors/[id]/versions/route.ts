import { prisma } from '@/lib/prisma';
import { withFakeLatency } from '@/lib/fake-latency';
import { err, handleError, ok } from '@/lib/api-response';
import { FactorVersionCreateSchema } from '@/lib/validation';

/**
 * @openapi
 * /api/emission-factors/{id}/versions:
 *   post:
 *     summary: 배출계수 새 버전 등록
 *     description: |
 *       validFrom 이전 버전들의 validTo 를 자동으로 (validFrom - 1day) 로 갱신한다.
 *       트랜잭션으로 처리되며 버전 번호는 max(version)+1.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    const input = FactorVersionCreateSchema.parse({ ...json, factorId: params.id });
    const validFrom = new Date(input.validFrom);

    const created = await withFakeLatency(
      () =>
        prisma.$transaction(async (tx) => {
          const factor = await tx.emissionFactor.findUnique({
            where: { id: params.id },
            include: { versions: true },
          });
          if (!factor) {
            throw new Error('FACTOR_NOT_FOUND');
          }
          // 이전 버전들의 validTo 자동 마감
          const dayBefore = new Date(validFrom);
          dayBefore.setUTCDate(dayBefore.getUTCDate() - 1);
          await tx.factorVersion.updateMany({
            where: {
              factorId: params.id,
              validFrom: { lt: validFrom },
              OR: [{ validTo: null }, { validTo: { gte: validFrom } }],
            },
            data: { validTo: dayBefore },
          });
          const nextVersion = factor.versions.reduce((m, v) => Math.max(m, v.version), 0) + 1;
          return tx.factorVersion.create({
            data: {
              factorId: params.id,
              version: nextVersion,
              value: input.value,
              validFrom,
              validTo: input.validTo ? new Date(input.validTo) : null,
              note: input.note ?? null,
            },
          });
        }),
      { mayFail: true, opName: '배출계수 버전 등록' },
    );
    return ok(created, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === 'FACTOR_NOT_FOUND') {
      return err('NOT_FOUND', '해당 배출계수를 찾을 수 없습니다.', 404);
    }
    return handleError(e);
  }
}
