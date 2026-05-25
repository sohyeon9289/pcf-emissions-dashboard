import { prisma } from '@/lib/prisma';
import { withFakeLatency } from '@/lib/fake-latency';
import { handleError, ok } from '@/lib/api-response';

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
