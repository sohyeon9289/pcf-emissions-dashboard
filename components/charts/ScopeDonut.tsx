'use client';

import { memo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { ScopeBreakdown } from '@/features/pcf/types';
import { SCOPE_COLOR_VAR, SCOPE_LABEL } from '@/lib/domain';
import { formatCO2e } from '@/lib/units';

type Props = { data: ScopeBreakdown[]; height?: number };

export const ScopeDonut = memo(function ScopeDonut({ data, height = 220 }: Props) {
  const filtered = data.filter((d) => d.emissionsKg > 0);
  const total = filtered.reduce((s, d) => s + d.emissionsKg, 0);
  return (
    <div className="flex w-full items-center gap-4">
      <div className="relative flex-1" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filtered}
              dataKey="emissionsKg"
              nameKey="scope"
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="85%"
              paddingAngle={2}
              stroke="hsl(var(--background))"
              strokeWidth={2}
            >
              {filtered.map((d) => (
                <Cell key={d.scope} fill={SCOPE_COLOR_VAR[d.scope]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number, name) => [
                formatCO2e(value, { unit: 'tCO2e' }),
                SCOPE_LABEL[name as keyof typeof SCOPE_LABEL] ?? name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">합계</p>
          <p className="text-base font-bold">{formatCO2e(total, { unit: 'tCO2e' })}</p>
        </div>
      </div>
      <ul className="flex flex-col gap-1.5 text-xs">
        {data.map((d) => (
          <li key={d.scope} className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: SCOPE_COLOR_VAR[d.scope] }}
            />
            <span className="font-medium">{SCOPE_LABEL[d.scope]}</span>
            <span className="ml-auto text-muted-foreground">
              {(d.share * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
});
