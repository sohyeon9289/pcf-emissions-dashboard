'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { FieldError, FieldHint, Input, Label, Select } from '@/components/ui/Input';
import { ScopeBadge } from '@/components/ui/Badge';
import {
  EmissionFactorCreateSchema,
  type EmissionFactorCreateInput,
} from '@/lib/validation';
import { useActivityTypes, useEmissionFactors } from '@/features/pcf/queries';
import { useCreateEmissionFactor } from '@/features/pcf/mutations';
import { PCF_BASE_UNIT } from '@/lib/domain';

const today = () => new Date().toISOString().slice(0, 10);

const defaults: EmissionFactorCreateInput = {
  typeKey: '',
  description: '',
  numerator: PCF_BASE_UNIT,
  denominator: '',
  source: '',
  initialValue: 0,
  initialValidFrom: today(),
  initialNote: '',
};

export function EmissionFactorForm({ onSuccess }: { onSuccess?: () => void }) {
  const types = useActivityTypes();
  const factors = useEmissionFactors();
  const mut = useCreateEmissionFactor();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
    setError,
  } = useForm<EmissionFactorCreateInput>({
    resolver: zodResolver(EmissionFactorCreateSchema),
    defaultValues: defaults,
  });

  const typeKey = watch('typeKey');
  const denominator = watch('denominator');
  const selectedType = types.data?.find((t) => t.key === typeKey);

  // 이미 배출계수가 등록된 활동 유형은 후보에서 제외 (typeKey unique)
  const usedTypeKeys = React.useMemo(
    () => new Set((factors.data ?? []).map((f) => f.typeKey)),
    [factors.data],
  );
  const availableTypes = (types.data ?? []).filter((t) => !usedTypeKeys.has(t.key));

  React.useEffect(() => {
    if (selectedType && !denominator) {
      setValue('denominator', selectedType.defaultUnit);
    }
  }, [selectedType, denominator, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await mut.mutateAsync({
        ...data,
        source: data.source?.trim() || null,
        initialNote: data.initialNote?.trim() || null,
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
      <div className="space-y-1.5">
        <Label htmlFor="ef-type" required>
          활동 유형
        </Label>
        <Select id="ef-type" {...register('typeKey')} error={!!errors.typeKey}>
          <option value="">선택하세요</option>
          {availableTypes.map((t) => (
            <option key={t.key} value={t.key}>
              [{t.scope.replace('SCOPE_', 'S')}] {t.label} ({t.defaultUnit})
            </option>
          ))}
        </Select>
        {selectedType ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <ScopeBadge scope={selectedType.scope} />
            <span>기본 단위: {selectedType.defaultUnit}</span>
            {selectedType.category ? <span>· {selectedType.category}</span> : null}
          </div>
        ) : (
          <FieldHint>
            등록할 활동 유형이 없으면 먼저 활동 유형을 추가하세요. 이미 배출계수가 등록된 유형은
            목록에서 제외됩니다.
          </FieldHint>
        )}
        <FieldError message={errors.typeKey?.message} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ef-desc" required>
          설명
        </Label>
        <Input
          id="ef-desc"
          placeholder="예: KEPCO 평균 전력 배출계수"
          {...register('description')}
          error={!!errors.description}
        />
        <FieldError message={errors.description?.message} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="ef-num" required>
            단위 분자
          </Label>
          <Input
            id="ef-num"
            placeholder="kgCO2e"
            {...register('numerator')}
            error={!!errors.numerator}
          />
          <FieldHint>고정값 권장: kgCO2e</FieldHint>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ef-den" required>
            단위 분모
          </Label>
          <Input
            id="ef-den"
            placeholder="kWh / L / kg / ton-km"
            {...register('denominator')}
            error={!!errors.denominator}
          />
          <FieldError message={errors.denominator?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ef-source">출처</Label>
          <Input
            id="ef-source"
            placeholder="예: KEPCO 2024"
            {...register('source')}
          />
        </div>
      </div>

      <div className="rounded-md border bg-muted/30 p-3 space-y-3">
        <div className="text-xs font-semibold text-muted-foreground">초기 버전 (v1)</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="ef-val" required>
              값
            </Label>
            <Input
              id="ef-val"
              type="number"
              step="any"
              {...register('initialValue', { valueAsNumber: true })}
              error={!!errors.initialValue}
            />
            <FieldError message={errors.initialValue?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ef-from" required>
              유효 시작일
            </Label>
            <Input
              id="ef-from"
              type="date"
              {...register('initialValidFrom')}
              error={!!errors.initialValidFrom}
            />
            <FieldError message={errors.initialValidFrom?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ef-note">메모</Label>
            <Input
              id="ef-note"
              placeholder="개정 사유 등"
              {...register('initialNote')}
            />
          </div>
        </div>
      </div>

      {errors.root?.message ? (
        <p className="text-sm text-destructive">{errors.root.message}</p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="submit" loading={isSubmitting || mut.isPending}>
          배출계수 추가
        </Button>
      </div>
    </form>
  );
}
