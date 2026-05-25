import { prisma } from '@/lib/prisma';
import { withFakeLatency } from '@/lib/fake-latency';
import { handleError, ok } from '@/lib/api-response';
import { PostUpsertSchema } from '@/lib/validation';

/**
 * @openapi
 * /api/posts:
 *   get:
 *     summary: 게시물 목록
 *     parameters:
 *       - in: query
 *         name: resourceUid
 *         schema: { type: string }
 *       - in: query
 *         name: dateTime
 *         description: "YYYY-MM"
 *         schema: { type: string }
 *   post:
 *     summary: 게시물 생성 또는 수정 (id 있으면 update)
 *     description: 영문 과제의 createOrUpdatePost 시뮬레이션. 약 15% 실패.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const resourceUid = url.searchParams.get('resourceUid') ?? undefined;
    const dateTime = url.searchParams.get('dateTime') ?? undefined;
    const posts = await withFakeLatency(() =>
      prisma.post.findMany({
        where: { resourceUid, dateTime },
        orderBy: [{ dateTime: 'desc' }, { createdAt: 'desc' }],
      }),
    );
    return ok(posts);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const input = PostUpsertSchema.parse(json);
    const result = await withFakeLatency(
      () =>
        input.id
          ? prisma.post.update({
              where: { id: input.id },
              data: {
                title: input.title,
                resourceUid: input.resourceUid,
                dateTime: input.dateTime,
                content: input.content,
              },
            })
          : prisma.post.create({
              data: {
                title: input.title,
                resourceUid: input.resourceUid,
                dateTime: input.dateTime,
                content: input.content,
              },
            }),
      { mayFail: true, opName: '게시물 저장' },
    );
    return ok(result, { status: input.id ? 200 : 201 });
  } catch (e) {
    return handleError(e);
  }
}
