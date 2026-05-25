import { prisma } from '@/lib/prisma';
import { withFakeLatency } from '@/lib/fake-latency';
import { handleError, ok } from '@/lib/api-response';

/**
 * @openapi
 * /api/activity-types:
 *   get:
 *     summary: 활동 유형 목록 (GHG Scope 매핑 포함)
 *     responses:
 *       200:
 *         description: 목록
 */
export async function GET() {
  try {
    const types = await withFakeLatency(() =>
      prisma.activityType.findMany({
        orderBy: [{ scope: 'asc' }, { label: 'asc' }],
      }),
    );
    return ok(types);
  } catch (e) {
    return handleError(e);
  }
}
