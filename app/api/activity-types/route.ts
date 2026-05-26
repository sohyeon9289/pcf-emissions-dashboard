import { prisma } from '@/lib/prisma';
import { withFakeLatency } from '@/lib/fake-latency';
import { err, handleError, ok } from '@/lib/api-response';
import { ActivityTypeCreateSchema } from '@/lib/validation';

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

/**
 * @openapi
 * /api/activity-types:
 *   post:
 *     summary: 활동 유형 생성
 */
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const input = ActivityTypeCreateSchema.parse(json);
    const created = await withFakeLatency(
      () =>
        prisma.$transaction(async (tx) => {
          const exists = await tx.activityType.findUnique({ where: { key: input.key } });
          if (exists) throw new Error('TYPE_EXISTS');
          return tx.activityType.create({
            data: {
              key: input.key,
              label: input.label,
              scope: input.scope,
              category: input.category ?? null,
              defaultUnit: input.defaultUnit,
              description: input.description ?? null,
            },
          });
        }),
      { mayFail: true, opName: '활동 유형 생성' },
    );
    return ok(created, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === 'TYPE_EXISTS') {
      return err('TYPE_EXISTS', '같은 키의 활동 유형이 이미 존재합니다.', 409);
    }
    return handleError(e);
  }
}
