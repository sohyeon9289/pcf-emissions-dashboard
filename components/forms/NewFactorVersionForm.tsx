'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { FieldError, FieldHint, Input, Label } from '@/components/ui/Input';
import { FactorVersionCreateSchema, type FactorVersionCreateInput } from '@/lib/validation';
import { useCreateFactorVersion } from '@/features/pcf/mutations';
import type { FactorVersionDto } from '@/features/pcf/api';

type Props = {
  factorId: string;
  unit: string;
  currentVersions: FactorVersionDto[];
  onDone?: () => void;
};

export function NewFactorVersionForm({ factorId, unit, currentVersions, onDone }: Props) {
  const mut = useCreateFactorVersion();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<Omit<FactorVersionCreateInput, 'factorId'>>({
    resolver: zodResolver(FactorVersionCreateSchema.omit({ factorId: true })),
    defaultValues: {
      value: undefined as unknown as number,
      validFrom: '',
      validTo: null,
      note: '',
    },
  });
  const watchedFrom = watch('validFrom');

  const previousOpen = currentVersions
    .filter((v) => v.validTo === null || (watchedFrom && new Date(v.validTo) >= new Date(watchedFrom)))
    .filter((v) => !watchedFrom || new Date(v.validFrom) < new Date(watchedFrom));

  const onSubmit = handleSubmit((data) => {
    mut.mutate(
      {
        factorId,
        input: {
          ...data,
          validTo: data.validTo ? data.validTo : null,
        },
      },
      {
        onSuccess: () => {
          reset();
          onDone?.();
        },
      },
    );
  });

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1">
        <Label required>값 ({unit})</Label>
        <Input
          type="number"
          step="any"
          min={0}
          {...register('value', { valueAsNumber: true })}
          error={!!errors.value}
        />
        <FieldError message={errors.value?.message} />
      </div>
      <div className="flex flex-col gap-1">
        <Label required>유효 시작일</Label>
        <Input type="date" {...register('validFrom')} error={!!errors.validFrom} />
        <FieldError message={errors.validFrom?.message} />
      </div>
      <div className="flex flex-col gap-1">
        <Label>유효 종료일 (선택)</Label>
        <Input type="date" {...register('validTo')} error={!!errors.validTo} />
        <FieldHint>비워두면 가장 최신 버전으로 사용됩니다.</FieldHint>
      </div>
      <div className="flex flex-col gap-1">
        <Label>메모</Label>
        <Input {...register('note')} placeholder="예: 환경부 2026 업데이트" />
      </div>
      {watchedFrom && previousOpen.length > 0 ? (
        <div className="col-span-full rounded-md border border-warning/30 bg-warning/5 p-2 text-xs">
          저장 시 v{previousOpen.map((v) => v.version).join(', v')} 의 유효 종료일이{' '}
          <strong>{shiftBack(watchedFrom)}</strong> 로 자동 갱신됩니다.
        </div>
      ) : null}
      <div className="col-span-full flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => reset()}>
          초기화
        </Button>
        <Button type="submit" loading={mut.isPending}>
          새 버전 등록
        </Button>
      </div>
    </form>
  );
}

function shiftBack(iso: string): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
