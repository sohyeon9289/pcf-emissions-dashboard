import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withFakeLatency } from '@/lib/fake-latency';
import { handleError, ok } from '@/lib/api-response';
import { ActivityCreateSchema, ActivityFilterSchema } from '@/lib/validation';

/**
 * @openapi
 * /api/activities:
 *   get:
 *     summary: 활동 데이터 조회 (필터링 가능)
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema: { type: string }
 *       - in: query
 *         name: typeKey
 *         schema: { type: string }
 *       - in: query
 *         name: scope
 *         schema: { type: string, enum: [SCOPE_1, SCOPE_2, SCOPE_3] }
 *       - in: query
 *         name: from
 *         description: "YYYY-MM"
 *         schema: { type: string }
 *       - in: query
 *         name: to
 *         description: "YYYY-MM"
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 활동 목록 (회사·유형 정보 포함)
 *   post:
 *     summary: 활동 데이터 추가
 *     responses:
 *       201:
 *         description: 생성됨
 *       400:
 *         description: 검증 실패
 *       503:
 *         description: 시뮬레이션 실패 (재시도 가능)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const filter = ActivityFilterSchema.parse({
      companyId: url.searchParams.get('companyId') ?? undefined,
      typeKey: url.searchParams.get('typeKey') ?? undefined,
      scope: url.searchParams.get('scope') ?? undefined,
      from: url.searchParams.get('from') ?? undefined,
      to: url.searchParams.get('to') ?? undefined,
    });

    const where: Prisma.ActivityWhereInput = {};
    if (filter.companyId) where.companyId = filter.companyId;
    if (filter.typeKey) where.typeKey = filter.typeKey;
    if (filter.scope) {
      where.type = { scope: filter.scope };
    }
    if (filter.from || filter.to) {
      where.date = {};
      if (filter.from) (where.date as Prisma.DateTimeFilter).gte = new Date(`${filter.from}-01`);
      if (filter.to) {
        const [y, m] = filter.to.split('-').map(Number);
        const lastDay = new Date(Date.UTC(y!, m!, 0)).toISOString().slice(0, 10);
        (where.date as Prisma.DateTimeFilter).lte = new Date(lastDay);
      }
    }

    const activities = await withFakeLatency(() =>
      prisma.activity.findMany({
        where,
        orderBy: [{ date: 'asc' }, { id: 'asc' }],
        include: { company: true, type: true },
      }),
    );
    return ok(activities);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const input = ActivityCreateSchema.parse(json);
    const created = await withFakeLatency(
      () =>
        prisma.activity.create({
          data: {
            companyId: input.companyId,
            typeKey: input.typeKey,
            date: new Date(input.date),
            description: input.description ?? null,
            amount: input.amount,
            unit: input.unit,
            source: input.source ?? null,
          },
          include: { type: true, company: true },
        }),
      { mayFail: true, opName: '활동 데이터 저장' },
    );
    return ok(created, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
