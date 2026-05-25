import { prisma } from '@/lib/prisma';
import { withFakeLatency } from '@/lib/fake-latency';
import { err, handleError, ok } from '@/lib/api-response';
import { parseActivitiesFromXlsx } from '@/lib/excel-parser';

/**
 * @openapi
 * /api/import/excel:
 *   post:
 *     summary: Excel 파일 파싱 미리보기 또는 커밋
 *     description: |
 *       multipart/form-data 로 file 업로드.
 *       form field "mode" = "preview" 인 경우 파싱만 수행 (저장 X).
 *       form field "mode" = "commit" + "companyId" 인 경우 트랜잭션으로 일괄 저장.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const mode = (formData.get('mode') ?? 'preview') as 'preview' | 'commit';
    const companyId = (formData.get('companyId') ?? '') as string;

    if (!(file instanceof File)) {
      return err('NO_FILE', '업로드된 파일이 없습니다.', 400);
    }
    if (file.size > 4 * 1024 * 1024) {
      return err('FILE_TOO_LARGE', '4MB 이하의 파일만 지원합니다.', 413);
    }
    const buffer = await file.arrayBuffer();
    const preview = parseActivitiesFromXlsx(buffer);

    if (mode === 'preview') {
      return ok({ ...preview, fileName: file.name });
    }

    // commit
    if (!companyId) {
      return err('COMPANY_REQUIRED', '회사를 선택해주세요.', 400);
    }
    const validRows = preview.rows.filter((r) => r.errors.length === 0 && r.typeKey);
    if (validRows.length === 0) {
      return err('NO_VALID_ROWS', '저장할 유효한 행이 없습니다.', 400);
    }

    const created = await withFakeLatency(
      () =>
        prisma.$transaction(async (tx) => {
          const company = await tx.company.findUnique({ where: { id: companyId } });
          if (!company) throw new Error('COMPANY_NOT_FOUND');
          let count = 0;
          for (const r of validRows) {
            await tx.activity.create({
              data: {
                companyId,
                typeKey: r.typeKey!,
                date: new Date(r.date!),
                description: r.description,
                amount: r.amount!,
                unit: r.unit!,
                source: `import:${file.name}`,
              },
            });
            count += 1;
          }
          return count;
        }),
      { mayFail: true, opName: 'Excel 임포트' },
    );
    return ok({ imported: created, fileName: file.name }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === 'COMPANY_NOT_FOUND') {
      return err('NOT_FOUND', '회사를 찾을 수 없습니다.', 404);
    }
    return handleError(e);
  }
}
