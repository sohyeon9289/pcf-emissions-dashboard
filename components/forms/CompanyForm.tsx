'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { FieldError, FieldHint, Input, Label } from '@/components/ui/Input';
import { CompanyCreateSchema, type CompanyCreateInput } from '@/lib/validation';
import { useCreateCompany } from '@/features/pcf/mutations';

const defaults: CompanyCreateInput = {
  id: '',
  name: '',
  countryCode: 'KR',
  description: '',
};

export function CompanyForm({ onSuccess }: { onSuccess?: () => void }) {
  const mut = useCreateCompany();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<CompanyCreateInput>({
    resolver: zodResolver(CompanyCreateSchema),
    defaultValues: defaults,
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await mut.mutateAsync({
        ...data,
        countryCode: data.countryCode.toUpperCase(),
        description: data.description?.trim() || null,
      });
      reset(defaults);
      onSuccess?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '저장 실패';
      setError('root', { message: msg });
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="company-id" required>
            ID (영문 키)
          </Label>
          <Input
            id="company-id"
            placeholder="hanacorp"
            {...register('id')}
            error={!!errors.id}
          />
          <FieldHint>URL/필터에서 사용. 영문/숫자/하이픈/언더스코어.</FieldHint>
          <FieldError message={errors.id?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="company-name" required>
            회사명
          </Label>
          <Input
            id="company-name"
            placeholder="HanaCorp"
            {...register('name')}
            error={!!errors.name}
          />
          <FieldError message={errors.name?.message} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="company-country" required>
            국가 코드 (ISO-3166 alpha-2)
          </Label>
          <Input
            id="company-country"
            placeholder="KR"
            maxLength={2}
            {...register('countryCode')}
            error={!!errors.countryCode}
          />
          <FieldHint>예: KR, US, DE. 없는 국가면 자동 등록.</FieldHint>
          <FieldError message={errors.countryCode?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="company-desc">설명</Label>
          <Input
            id="company-desc"
            placeholder="국내 제조 본사 (선택)"
            {...register('description')}
          />
        </div>
      </div>
      {errors.root?.message ? (
        <p className="text-sm text-destructive">{errors.root.message}</p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="submit" loading={isSubmitting || mut.isPending}>
          회사 추가
        </Button>
      </div>
    </form>
  );
}
