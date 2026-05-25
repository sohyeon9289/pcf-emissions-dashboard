import { prisma } from '@/lib/prisma';
import { withFakeLatency } from '@/lib/fake-latency';
import { err, handleError, ok } from '@/lib/api-response';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await withFakeLatency(() => prisma.post.delete({ where: { id: params.id } }), {
      mayFail: true,
      opName: '게시물 삭제',
    });
    return ok({ deleted: true });
  } catch (e) {
    if (e instanceof Error && e.message.includes('Record to delete does not exist')) {
      return err('NOT_FOUND', '해당 게시물을 찾을 수 없습니다.', 404);
    }
    return handleError(e);
  }
}
