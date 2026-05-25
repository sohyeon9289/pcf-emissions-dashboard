'use client';

import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, FieldError, Label, FieldHint, Select } from '@/components/ui/Input';
import { ScopeBadge } from '@/components/ui/Badge';
import { useActivityTypes, useCompanies, useEmissionFactors } from '@/features/pcf/queries';
import { useCreateActivity } from '@/features/pcf/mutations';
import { ActivityCreateSchema, type ActivityCreateInput } from '@/lib/validation';
import { UNIT_BY_DENOMINATOR } from '@/lib/domain';
import { calcActivityEmission, pickFactorVersion } from '@/features/pcf/calc';
import { formatCO2e } from '@/lib/units';
import type {
  ActivityTypeView,
  EmissionFactorView,
} from '@/features/pcf/types';

const today = () => new Date().toISOString().slice(0, 10);

const defaultValues: ActivityCreateInput = {
  companyId: '',
  typeKey: '',
  date: today(),
  description: '',
  amount: 0,
  unit: '',
  source: '',
};

export function ActivityForm({ onSuccess }: { onSuccess?: () => void }) {
  const companies = useCompanies();
  const types = useActivityTypes();
  const factors = useEmissionFactors();
  const createMut = useCreateActivity();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ActivityCreateInput>({
    resolver: zodResolver(ActivityCreateSchema),
    defaultValues,
  });

  const watchedTypeKey = watch('typeKey');
  const watchedAmount = watch('amount');
  const watchedUnit = watch('unit');
  const watchedDate = watch('date');

  const selectedType: ActivityTypeView | null = React.useMemo(() => {
    const t = types.data?.find((x) => x.key === watchedTypeKey);
    return t
      ? {
          key: t.key,
          label: t.label,
          scope: t.scope,
          category: t.category ?? null,
          defaultUnit: t.defaultUnit,
          description: t.description ?? null,
        }
      : null;
  }, [types.data, watchedTypeKey]);

  const selectedFactor: EmissionFactorView | null = React.useMemo(() => {
    const f = factors.data?.find((x) => x.typeKey === watchedTypeKey);
    if (!f) return null;
    return {
      id: f.id,
      typeKey: f.typeKey,
      description: f.description,
      unit: f.unit,
      numerator: f.numerator,
      denominator: f.denominator,
      source: f.source ?? null,
      versions: f.versions.map((v) => ({
        id: v.id,
        factorId: v.factorId,
        version: v.version,
        value: v.value,
        validFrom: typeof v.validFrom === 'string' ? v.validFrom.slice(0, 10) : v.validFrom,
        validTo: v.validTo
          ? typeof v.validTo === 'string'
            ? v.validTo.slice(0, 10)
            : v.validTo
          : null,
        note: v.note ?? null,
      })),
    };
  }, [factors.data, watchedTypeKey]);

  React.useEffect(() => {
    if (selectedType) {
      setValue('unit', selectedType.defaultUnit, { shouldValidate: false });
    }
  }, [selectedType, setValue]);

  const unitOptions = React.useMemo(() => {
    if (!selectedFactor) return [];
    return UNIT_BY_DENOMINATOR[selectedFactor.denominator] ?? [selectedFactor.denominator];
  }, [selectedFactor]);

  const preview = React.useMemo(() => {
    if (!selectedType || !selectedFactor) return null;
    if (!Number.isFinite(watchedAmount) || watchedAmount === 0) return null;
    const factorVersion = pickFactorVersion(selectedFactor, watchedDate);
    const result = calcActivityEmission(
      {
        id: 'preview',
        companyId: 'preview',
        typeKey: watchedTypeKey,
        date: watchedDate,
        amount: Number(watchedAmount),
        unit: watchedUnit,
      },
      selectedType,
      selectedFactor,
    );
    return { result, factorVersion };
  }, [selectedType, selectedFactor, watchedTypeKey, watchedAmount, watchedUnit, watchedDate]);

  const onSubmit = handleSubmit((data) => {
    createMut.mutate(data, {
      onSuccess: () => {
        reset(defaultValues);
        onSuccess?.();
      },
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>활동 데이터 추가</CardTitle>
        <CardDescription>
          활동 유형을 선택하면 단위와 적용 배출계수가 자동으로 결정됩니다. 입력값 변경 시 예상 배출량이 실시간으로 미리보기됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="companyId" required>
              회사
            </Label>
            <Select id="companyId" {...register('companyId')} error={!!errors.companyId}>
              <option value="">선택…</option>
              {companies.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <FieldError message={errors.companyId?.message} />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="typeKey" required>
              활동 유형
            </Label>
            <Select id="typeKey" {...register('typeKey')} error={!!errors.typeKey}>
              <option value="">선택…</option>
              {types.data?.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </Select>
            <FieldError message={errors.typeKey?.message} />
            {selectedType ? (
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <ScopeBadge scope={selectedType.scope} />
                <span>{selectedType.category}</span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="date" required>
              일자
            </Label>
            <Input id="date" type="date" {...register('date')} error={!!errors.date} />
            <FieldError message={errors.date?.message} />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="description">설명</Label>
            <Input
              id="description"
              placeholder="예: 한국전력 / 플라스틱 1"
              {...register('description')}
              error={!!errors.description}
            />
            <FieldError message={errors.description?.message?.toString()} />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="amount" required>
              활동량
            </Label>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <Input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={0}
                  value={Number.isFinite(field.value) ? field.value : 0}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  error={!!errors.amount}
                />
              )}
            />
            <FieldError message={errors.amount?.message} />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="unit" required>
              단위
            </Label>
            <Select id="unit" {...register('unit')} error={!!errors.unit}>
              {unitOptions.length === 0 ? (
                <option value="">활동 유형을 먼저 선택하세요</option>
              ) : (
                unitOptions.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))
              )}
            </Select>
            <FieldError message={errors.unit?.message} />
            {selectedFactor ? (
              <FieldHint>
                배출계수 단위 분모: <strong>{selectedFactor.denominator}</strong> (자동 변환)
              </FieldHint>
            ) : null}
          </div>

          {preview ? (
            <div className="col-span-full rounded-md border border-border bg-muted/40 p-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                예상 배출량 미리보기
              </p>
              <p className="mt-1 text-lg font-bold">
                {preview.result.warning ? (
                  <span className="text-destructive">{preview.result.warning}</span>
                ) : (
                  formatCO2e(preview.result.emissionsKg, { unit: 'tCO2e' })
                )}
              </p>
              {preview.factorVersion ? (
                <p className="text-xs text-muted-foreground">
                  적용 계수: v{preview.factorVersion.version} ={' '}
                  {preview.factorVersion.value} {selectedFactor?.unit} (유효 시작 {preview.factorVersion.validFrom})
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="col-span-full flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => reset(defaultValues)}
              disabled={isSubmitting}
            >
              초기화
            </Button>
            <Button type="submit" loading={createMut.isPending}>
              저장
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
