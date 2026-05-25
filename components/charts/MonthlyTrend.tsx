'use client';

import { memo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MonthlySeriesPoint } from '@/features/pcf/types';
import { SCOPE_COLOR_VAR } from '@/lib/domain';
import { formatCO2e } from '@/lib/units';

type Props = {
  data: MonthlySeriesPoint[];
  height?: number;
};

export const MonthlyTrend = memo(function MonthlyTrend({ data, height = 280 }: Props) {
  const chartData = data.map((d) => ({
    month: d.yearMonth,
    'Scope 1': d.byScope.SCOPE_1 / 1000,
    'Scope 2': d.byScope.SCOPE_2 / 1000,
    'Scope 3': d.byScope.SCOPE_3 / 1000,
    total: d.total / 1000,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="s1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SCOPE_COLOR_VAR.SCOPE_1} stopOpacity={0.6} />
            <stop offset="100%" stopColor={SCOPE_COLOR_VAR.SCOPE_1} stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="s2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SCOPE_COLOR_VAR.SCOPE_2} stopOpacity={0.6} />
            <stop offset="100%" stopColor={SCOPE_COLOR_VAR.SCOPE_2} stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="s3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SCOPE_COLOR_VAR.SCOPE_3} stopOpacity={0.6} />
            <stop offset="100%" stopColor={SCOPE_COLOR_VAR.SCOPE_3} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          className="text-xs fill-muted-foreground"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v) => `${v.toFixed(2)}t`}
          className="text-xs fill-muted-foreground"
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value: number, name: string) => [
            formatCO2e(value * 1000, { unit: 'tCO2e' }),
            name,
          ]}
        />
        <Area
          type="monotone"
          dataKey="Scope 1"
          stackId="1"
          stroke={SCOPE_COLOR_VAR.SCOPE_1}
          fill="url(#s1)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="Scope 2"
          stackId="1"
          stroke={SCOPE_COLOR_VAR.SCOPE_2}
          fill="url(#s2)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="Scope 3"
          stackId="1"
          stroke={SCOPE_COLOR_VAR.SCOPE_3}
          fill="url(#s3)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});
