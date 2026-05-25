import { prisma } from '@/lib/prisma';
import { withFakeLatency } from '@/lib/fake-latency';
import { err, handleError, ok } from '@/lib/api-response';
import { ActivityUpdateSchema } from '@/lib/validation';

/**
 * @openapi
 * /api/activities/{id}:
 *   patch:
 *     summary: 활동 데이터 수정
 *   delete:
 *     summary: 활동 데이터 삭제
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    const input = ActivityUpdateSchema.parse(json);
    const updated = await withFakeLatency(
      () =>
        prisma.activity.update({
          where: { id: params.id },
          data: {
            ...(input.companyId ? { companyId: input.companyId } : {}),
            ...(input.typeKey ? { typeKey: input.typeKey } : {}),
            ...(input.date ? { date: new Date(input.date) } : {}),
            ...(input.amount !== undefined ? { amount: input.amount } : {}),
            ...(input.unit ? { unit: input.unit } : {}),
            ...(input.description !== undefined ? { description: input.description ?? null } : {}),
            ...(input.source !== undefined ? { source: input.source ?? null } : {}),
          },
          include: { type: true, company: true },
        }),
      { mayFail: true, opName: '활동 데이터 수정' },
    );
    return ok(updated);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await withFakeLatency(() => prisma.activity.delete({ where: { id: params.id } }), {
      mayFail: true,
      opName: '활동 데이터 삭제',
    });
    return ok({ deleted: true });
  } catch (e) {
    if (e instanceof Error && e.message.includes('Record to delete does not exist')) {
      return err('NOT_FOUND', '해당 활동 데이터를 찾을 수 없습니다.', 404);
    }
    return handleError(e);
  }
}
