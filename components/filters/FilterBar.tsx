'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useFilterUrl } from '@/features/filters/useFilterUrl';
import { useActivityTypes, useCompanies } from '@/features/pcf/queries';
import { SCOPE_LABEL } from '@/lib/domain';

const MONTHS = [
  '2025-01',
  '2025-02',
  '2025-03',
  '2025-04',
  '2025-05',
  '2025-06',
  '2025-07',
  '2025-08',
  '2025-09',
  '2025-10',
  '2025-11',
  '2025-12',
];

export function FilterBar() {
  const { filter, setFilter, reset, activeCount } = useFilterUrl();
  const companies = useCompanies();
  const types = useActivityTypes();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:p-4">
      <div className="flex flex-wrap items-end gap-2">
        <FilterField label="회사">
          <Select
            value={filter.companyId ?? ''}
            onChange={(e) => setFilter({ companyId: e.target.value })}
            disabled={companies.isLoading}
          >
            <option value="">전체</option>
            {companies.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="활동 유형">
          <Select
            value={filter.typeKey ?? ''}
            onChange={(e) => setFilter({ typeKey: e.target.value })}
            disabled={types.isLoading}
          >
            <option value="">전체</option>
            {types.data?.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="Scope">
          <Select
            value={filter.scope ?? ''}
            onChange={(e) =>
              setFilter({
                scope: e.target.value as 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3' | '',
              })
            }
          >
            <option value="">전체</option>
            <option value="SCOPE_1">{SCOPE_LABEL.SCOPE_1}</option>
            <option value="SCOPE_2">{SCOPE_LABEL.SCOPE_2}</option>
            <option value="SCOPE_3">{SCOPE_LABEL.SCOPE_3}</option>
          </Select>
        </FilterField>
        <FilterField label="시작 월">
          <Select
            value={filter.from ?? ''}
            onChange={(e) => setFilter({ from: e.target.value })}
          >
            <option value="">전체</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="종료 월">
          <Select
            value={filter.to ?? ''}
            onChange={(e) => setFilter({ to: e.target.value })}
          >
            <option value="">전체</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </FilterField>
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          disabled={activeCount === 0}
          className="ml-auto"
        >
          <X className="h-3 w-3" /> 필터 초기화
        </Button>
      </div>
      {activeCount > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">적용된 필터:</span>
          {filter.companyId ? (
            <Badge tone="muted">
              회사: {companies.data?.find((c) => c.id === filter.companyId)?.name ?? filter.companyId}
            </Badge>
          ) : null}
          {filter.typeKey ? (
            <Badge tone="muted">
              유형: {types.data?.find((t) => t.key === filter.typeKey)?.label ?? filter.typeKey}
            </Badge>
          ) : null}
          {filter.scope ? <Badge tone="muted">{SCOPE_LABEL[filter.scope]}</Badge> : null}
          {filter.from ? <Badge tone="muted">시작 {filter.from}</Badge> : null}
          {filter.to ? <Badge tone="muted">종료 {filter.to}</Badge> : null}
        </div>
      ) : null}
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-[120px] flex-1 flex-col gap-1">
      <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
