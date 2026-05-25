'use client';

import { Badge } from '@/components/ui/Badge';
import type { FactorVersionDto } from '@/features/pcf/api';

export function FactorVersionTimeline({
  versions,
  unit,
}: {
  versions: FactorVersionDto[];
  unit: string;
}) {
  if (versions.length === 0) {
    return <p className="text-xs text-muted-foreground">등록된 버전이 없습니다.</p>;
  }
  const sorted = [...versions].sort((a, b) => a.version - b.version);
  return (
    <ol className="relative ml-3 space-y-3 border-l border-border pl-4">
      {sorted.map((v) => {
        const active = v.validTo === null;
        const from = String(v.validFrom).slice(0, 10);
        const to = v.validTo ? String(v.validTo).slice(0, 10) : '현재';
        return (
          <li key={v.id} className="relative">
            <span
              aria-hidden
              className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 ${
                active ? 'border-primary bg-background' : 'border-border bg-background'
              }`}
            />
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">v{v.version}</span>
              <Badge tone={active ? 'success' : 'muted'}>{active ? '현재' : '구버전'}</Badge>
              <span className="tabular-nums">
                {v.value} <span className="text-muted-foreground">{unit}</span>
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              유효 기간: {from} ~ {to}
            </p>
            {v.note ? <p className="mt-0.5 text-xs text-muted-foreground">메모: {v.note}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}
