/**
 * Zod schemas — API 입력 + 폼 입력 양쪽에서 공유.
 * 모든 사용자 입력은 이 스키마를 통과해야 한다.
 */
import { z } from 'zod';

export const ymRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
export const ymdRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;

export const GhgScopeSchema = z.enum(['SCOPE_1', 'SCOPE_2', 'SCOPE_3']);

export const ActivityCreateSchema = z.object({
  companyId: z.string().min(1, '회사를 선택해주세요.'),
  typeKey: z.string().min(1, '활동 유형을 선택해주세요.'),
  date: z.string().regex(ymdRegex, '날짜 형식은 YYYY-MM-DD 여야 합니다.'),
  description: z.string().max(200).optional().nullable(),
  amount: z
    .number({ invalid_type_error: '활동량은 숫자여야 합니다.' })
    .finite('유한한 숫자여야 합니다.')
    .nonnegative('활동량은 0 이상이어야 합니다.'),
  unit: z.string().min(1, '단위가 필요합니다.'),
  source: z.string().max(120).optional().nullable(),
});
export type ActivityCreateInput = z.infer<typeof ActivityCreateSchema>;

export const ActivityUpdateSchema = ActivityCreateSchema.partial();
export type ActivityUpdateInput = z.infer<typeof ActivityUpdateSchema>;

export const ActivityFilterSchema = z.object({
  companyId: z.string().optional(),
  typeKey: z.string().optional(),
  scope: GhgScopeSchema.optional(),
  from: z.string().regex(ymRegex).optional(),
  to: z.string().regex(ymRegex).optional(),
});
export type ActivityFilterInput = z.infer<typeof ActivityFilterSchema>;

export const FactorVersionCreateSchema = z.object({
  factorId: z.string().min(1),
  value: z.number().positive('배출계수는 양수여야 합니다.'),
  validFrom: z.string().regex(ymdRegex),
  validTo: z.string().regex(ymdRegex).nullable().optional(),
  note: z.string().max(200).optional().nullable(),
});
export type FactorVersionCreateInput = z.infer<typeof FactorVersionCreateSchema>;

export const PostUpsertSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, '제목을 입력해주세요.').max(200),
  resourceUid: z.string().min(1, '회사를 선택해주세요.'),
  dateTime: z.string().regex(ymRegex, '월 형식(YYYY-MM)이어야 합니다.'),
  content: z.string().max(5000).default(''),
});
export type PostUpsertInput = z.infer<typeof PostUpsertSchema>;

/** API 에러 표준 포맷 */
export type ApiError = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export function zodToApiError(err: z.ZodError, message = '입력값이 올바르지 않습니다.'): ApiError {
  const flat = err.flatten();
  return {
    code: 'VALIDATION_ERROR',
    message,
    fieldErrors: flat.fieldErrors as Record<string, string[]>,
  };
}
