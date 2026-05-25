import { prisma } from '@/lib/prisma';
import { withFakeLatency } from '@/lib/fake-latency';
import { handleError, ok } from '@/lib/api-response';

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
