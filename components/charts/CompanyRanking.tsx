'use client';

import { memo } from 'react';
import type { CompanyBreakdown } from '@/features/pcf/types';
import { formatCO2e } from '@/lib/units';

export const CompanyRanking = memo(function CompanyRanking({
  data,
}: {
  data: CompanyBreakdown[];
}) {
  const max = data.length > 0 ? data[0]!.emissionsKg : 0;
  return (
    <ul className="flex flex-col gap-2.5">
      {data.map((c) => {
        const pct = max > 0 ? (c.emissionsKg / max) * 100 : 0;
        return (
          <li key={c.companyId} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{c.companyName}</span>
              <span className="text-muted-foreground">
                {formatCO2e(c.emissionsKg, { unit: 'tCO2e' })} ·{' '}
                <span>{(c.share * 100).toFixed(1)}%</span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
      {data.length === 0 ? (
        <li className="text-xs text-muted-foreground">표시할 회사 데이터가 없습니다.</li>
      ) : null}
    </ul>
  );
});
