'use client';

import { memo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TypeBreakdown } from '@/features/pcf/types';
import { SCOPE_COLOR_VAR } from '@/lib/domain';
import { formatCO2e } from '@/lib/units';

type Props = { data: TypeBreakdown[]; height?: number };

export const TypeBar = memo(function TypeBar({ data, height = 280 }: Props) {
  const chartData = data.slice(0, 8).map((d) => ({
    label: d.label,
    emissions: d.emissionsKg / 1000,
    scope: d.scope,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v.toFixed(2)}t`}
          className="text-xs fill-muted-foreground"
        />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          width={130}
          className="text-xs fill-muted-foreground"
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(v: number) => [formatCO2e(v * 1000, { unit: 'tCO2e' }), '배출량']}
        />
        <Bar dataKey="emissions" radius={[0, 4, 4, 0]}>
          {chartData.map((d) => (
            <Cell key={d.label} fill={SCOPE_COLOR_VAR[d.scope]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});
