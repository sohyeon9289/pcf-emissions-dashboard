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

export const CompanyCreateSchema = z.object({
  id: z
    .string()
    .min(1, 'ID를 입력하세요.')
    .max(40)
    .regex(/^[a-zA-Z0-9_-]+$/, '영문/숫자/하이픈/언더스코어만 사용할 수 있습니다.'),
  name: z.string().min(1, '회사명을 입력하세요.').max(80),
  countryCode: z
    .string()
    .length(2, '2자리 국가 코드여야 합니다 (예: KR, US, DE).')
    .regex(/^[A-Z]{2}$/, '대문자 2글자여야 합니다.'),
  description: z.string().max(200).optional().nullable(),
});
export type CompanyCreateInput = z.infer<typeof CompanyCreateSchema>;

export const ActivityTypeCreateSchema = z.object({
  key: z
    .string()
    .min(1, '키를 입력하세요.')
    .max(40)
    .regex(/^[a-z0-9_]+$/, '소문자/숫자/언더스코어만 사용할 수 있습니다.'),
  label: z.string().min(1, '라벨을 입력하세요.').max(40),
  scope: GhgScopeSchema,
  category: z.string().max(60).optional().nullable(),
  defaultUnit: z.string().min(1, '기본 단위를 입력하세요.').max(20),
  description: z.string().max(200).optional().nullable(),
});
export type ActivityTypeCreateInput = z.infer<typeof ActivityTypeCreateSchema>;

export const EmissionFactorCreateSchema = z.object({
  typeKey: z.string().min(1, '활동 유형을 선택하세요.'),
  description: z.string().min(1, '설명을 입력하세요.').max(120),
  numerator: z.string().min(1).default('kgCO2e'),
  denominator: z.string().min(1, '단위 분모를 입력하세요.').max(20),
  source: z.string().max(120).optional().nullable(),
  initialValue: z.number().positive('초기 값은 양수여야 합니다.'),
  initialValidFrom: z.string().regex(ymdRegex, '유효 시작일은 YYYY-MM-DD 여야 합니다.'),
  initialNote: z.string().max(200).optional().nullable(),
});
export type EmissionFactorCreateInput = z.infer<typeof EmissionFactorCreateSchema>;

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
