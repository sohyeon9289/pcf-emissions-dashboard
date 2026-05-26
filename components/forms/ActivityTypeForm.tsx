'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { FieldError, FieldHint, Input, Label, Select } from '@/components/ui/Input';
import { ScopeBadge } from '@/components/ui/Badge';
import {
  ActivityTypeCreateSchema,
  type ActivityTypeCreateInput,
} from '@/lib/validation';
import { useCreateActivityType } from '@/features/pcf/mutations';
import { GHG_SCOPES, SCOPE_DESCRIPTION, SCOPE_LABEL } from '@/lib/domain';

const defaults: ActivityTypeCreateInput = {
  key: '',
  label: '',
  scope: 'SCOPE_1',
  category: '',
  defaultUnit: '',
  description: '',
};

export function ActivityTypeForm({ onSuccess }: { onSuccess?: () => void }) {
  const mut = useCreateActivityType();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
    setError,
  } = useForm<ActivityTypeCreateInput>({
    resolver: zodResolver(ActivityTypeCreateSchema),
    defaultValues: defaults,
  });

  const scope = watch('scope');

  const onSubmit = handleSubmit(async (data) => {
    try {
      await mut.mutateAsync({
        ...data,
        category: data.category?.trim() || null,
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
          <Label htmlFor="type-key" required>
            키 (영문)
          </Label>
          <Input
            id="type-key"
            placeholder="electricity"
            {...register('key')}
            error={!!errors.key}
          />
          <FieldHint>API/내부 식별자. 소문자/숫자/언더스코어만.</FieldHint>
          <FieldError message={errors.key?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="type-label" required>
            라벨 (한글)
          </Label>
          <Input
            id="type-label"
            placeholder="전력 사용"
            {...register('label')}
            error={!!errors.label}
          />
          <FieldError message={errors.label?.message} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="type-scope" required>
          GHG Scope
        </Label>
        <Select id="type-scope" {...register('scope')} error={!!errors.scope}>
          {GHG_SCOPES.map((s) => (
            <option key={s} value={s}>
              {SCOPE_LABEL[s]}
            </option>
          ))}
        </Select>
        <div className="rounded-md border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
          <div className="mb-1 flex items-center gap-2">
            <ScopeBadge scope={scope} />
            <span className="font-medium">선택한 Scope 설명</span>
          </div>
          <p>{SCOPE_DESCRIPTION[scope]}</p>
        </div>
        <FieldError message={errors.scope?.message} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="type-unit" required>
            기본 단위
          </Label>
          <Input
            id="type-unit"
            placeholder="kWh / L / ton-km / kg"
            {...register('defaultUnit')}
            error={!!errors.defaultUnit}
          />
          <FieldHint>활동량을 입력할 때 자주 쓰는 단위.</FieldHint>
          <FieldError message={errors.defaultUnit?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="type-cat">카테고리 (Scope 3)</Label>
          <Input
            id="type-cat"
            placeholder="예: 1. 구매한 제품/서비스"
            {...register('category')}
          />
          <FieldHint>Scope 3 카테고리 1~15 등 (선택).</FieldHint>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="type-desc">설명</Label>
        <Input
          id="type-desc"
          placeholder="간단한 설명 (선택)"
          {...register('description')}
        />
      </div>

      {errors.root?.message ? (
        <p className="text-sm text-destructive">{errors.root.message}</p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="submit" loading={isSubmitting || mut.isPending}>
          활동 유형 추가
        </Button>
      </div>
    </form>
  );
}
