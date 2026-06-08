'use client';

import { useMemo, useState } from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  simulateScenario,
  type ScenarioChange,
} from '@/features/pcf/simulate';
import type {
  ActivityTypeView,
  ActivityView,
  CompanyView,
  EmissionFactorView,
} from '@/features/pcf/types';
import { formatCO2e } from '@/lib/units';

type Lever = {
  typeKey: string;
  label: string;
  hint: string;
};

const LEVERS: Lever[] = [
  {
    typeKey: 'electricity_kepco',
    label: '전기 사용량 감축',
    hint: 'LED 전환·고효율 설비·재생에너지 PPA',
  },
  {
    typeKey: 'diesel',
    label: '자체 차량 디젤 감축',
    hint: '전기차 전환·하이브리드 도입',
  },
  {
    typeKey: 'transport_truck',
    label: '외주 운송 감축',
    hint: '묶음 배송·근거리 협력사 전환',
  },
  {
    typeKey: 'material_plastic1',
    label: '플라스틱 1 감축',
    hint: '재활용 소재 전환·경량화 설계',
  },
];

export function ScenarioPanel({
  activities,
  typesByKey,
  factorsByTypeKey,
  companies,
}: {
  activities: ActivityView[];
  typesByKey: Record<string, ActivityTypeView>;
  factorsByTypeKey: Record<string, EmissionFactorView>;
  companies: CompanyView[];
}) {
  const presentLevers = LEVERS.filter((l) => activities.some((a) => a.typeKey === l.typeKey));
  const initial = useMemo(
    () => Object.fromEntries(presentLevers.map((l) => [l.typeKey, 0])) as Record<string, number>,
    [presentLevers],
  );
  const [reductions, setReductions] = useState<Record<string, number>>(initial);

  const changes: ScenarioChange[] = useMemo(
    () =>
      Object.entries(reductions)
        .filter(([, pct]) => pct > 0)
        .map(([typeKey, pct]) => ({
          type: 'REDUCE_AMOUNT' as const,
          typeKey,
          reductionPct: pct,
        })),
    [reductions],
  );

  const result = useMemo(
    () =>
      simulateScenario({
        activities,
        typesByKey,
        factorsByTypeKey,
        companies,
        changes,
      }),
    [activities, typesByKey, factorsByTypeKey, companies, changes],
  );

  const hasData = result.baselineKg > 0;
  const isImproved = result.deltaKg < 0;
  const reset = () => setReductions(initial);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 sm:flex-row sm:items-center">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <CardTitle>What-if 시나리오</CardTitle>
            <CardDescription>
              레버를 조정하면 같은 기간 배출량이 어떻게 변하는지 즉시 시뮬레이션됩니다.
            </CardDescription>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={reset} aria-label="레버 초기화">
          <RotateCcw className="h-3.5 w-3.5" />
          초기화
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {presentLevers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            현재 필터 범위에 시뮬레이션 가능한 활동이 없습니다.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {presentLevers.map((lever) => {
              const value = reductions[lever.typeKey] ?? 0;
              const t = typesByKey[lever.typeKey];
              return (
                <div key={lever.typeKey} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <label
                      htmlFor={`lever-${lever.typeKey}`}
                      className="text-sm font-medium"
                    >
                      {t?.label ?? lever.label}
                    </label>
                    <span className="font-mono text-sm tabular-nums text-primary">
                      −{value}%
                    </span>
                  </div>
                  <input
                    id={`lever-${lever.typeKey}`}
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={value}
                    onChange={(e) =>
                      setReductions((prev) => ({
                        ...prev,
                        [lever.typeKey]: Number(e.target.value),
                      }))
                    }
                    className="accent-primary"
                  />
                  <p className="text-xs text-muted-foreground">{lever.hint}</p>
                </div>
              );
            })}
          </div>
        )}

        {hasData ? (
          <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/40 p-3 sm:grid-cols-3">
            <div>
              <div className="text-xs text-muted-foreground">현재 (baseline)</div>
              <div className="text-lg font-semibold">
                {formatCO2e(result.baselineKg, { unit: 'tCO2e' })}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">시나리오</div>
              <div className="text-lg font-semibold">
                {formatCO2e(result.scenarioKg, { unit: 'tCO2e' })}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">감축량</div>
              <div
                className={
                  'text-lg font-semibold ' +
                  (isImproved
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-muted-foreground')
                }
              >
                {result.deltaKg === 0
                  ? '0 tCO2e'
                  : `${result.deltaKg < 0 ? '−' : '+'}${formatCO2e(
                      Math.abs(result.deltaKg),
                      { unit: 'tCO2e' },
                    )}`}
                <span className="ml-1 text-xs text-muted-foreground">
                  ({(result.deltaPct * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
