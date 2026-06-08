'use client';

import { useEffect, useMemo, useState } from 'react';
import { Target, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input, Label, FieldHint } from '@/components/ui/Input';
import type { MonthlySeriesPoint } from '@/features/pcf/types';
import { formatCO2e } from '@/lib/units';

const STORAGE_KEY = 'pcf:emission-target:v1';

export type EmissionTargetSettings = {
  baseYear: number;
  baseAnnualTons: number;
  targetYear: number;
  targetReductionPct: number;
};

const DEFAULT_TARGET: EmissionTargetSettings = {
  baseYear: 2024,
  baseAnnualTons: 100,
  targetYear: 2030,
  targetReductionPct: 50,
};

function loadTarget(): EmissionTargetSettings {
  if (typeof window === 'undefined') return DEFAULT_TARGET;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TARGET;
    const parsed = JSON.parse(raw) as Partial<EmissionTargetSettings>;
    return { ...DEFAULT_TARGET, ...parsed };
  } catch {
    return DEFAULT_TARGET;
  }
}

function saveTarget(t: EmissionTargetSettings) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
  } catch {
    /* noop */
  }
}

function annualizeFromMonthly(monthly: MonthlySeriesPoint[]) {
  if (monthly.length === 0) return { annualizedKg: 0, monthsCount: 0 };
  const totalKg = monthly.reduce((s, m) => s + m.total, 0);
  const annualizedKg = (totalKg / monthly.length) * 12;
  return { annualizedKg, monthsCount: monthly.length };
}

function pickStatus(currentTons: number, paceTons: number) {
  if (paceTons <= 0) {
    return {
      tone: 'neutral' as const,
      Icon: Target,
      label: '기준값을 입력하면 진척도가 표시됩니다.',
    };
  }
  const ratio = currentTons / paceTons;
  if (ratio <= 1.0) {
    return {
      tone: 'good' as const,
      Icon: CheckCircle2,
      label: '목표 페이스 달성 중',
    };
  }
  if (ratio <= 1.1) {
    return {
      tone: 'warn' as const,
      Icon: AlertTriangle,
      label: '페이스 근접 (10% 이내)',
    };
  }
  return {
    tone: 'bad' as const,
    Icon: AlertOctagon,
    label: '페이스 초과',
  };
}

const TONE_STYLES = {
  good: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
  warn: 'border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  bad: 'border-destructive/40 bg-destructive/5 text-destructive',
  neutral: 'border-border bg-muted/40 text-muted-foreground',
} as const;

export function TargetPanel({ monthly }: { monthly: MonthlySeriesPoint[] }) {
  const [settings, setSettings] = useState<EmissionTargetSettings>(DEFAULT_TARGET);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettings(loadTarget());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveTarget(settings);
  }, [settings, hydrated]);

  const { annualizedKg, monthsCount } = useMemo(
    () => annualizeFromMonthly(monthly),
    [monthly],
  );
  const annualizedTons = annualizedKg / 1000;

  const targetAnnualTons = useMemo(
    () => settings.baseAnnualTons * (1 - settings.targetReductionPct / 100),
    [settings],
  );

  const span = Math.max(1, settings.targetYear - settings.baseYear);
  const nowYear = new Date().getUTCFullYear();
  const yearsElapsed = Math.min(span, Math.max(0, nowYear - settings.baseYear));
  const paceTargetTons =
    settings.baseAnnualTons -
    (settings.baseAnnualTons - targetAnnualTons) * (yearsElapsed / span);

  const status = pickStatus(annualizedTons, paceTargetTons);
  const reductionAchievedPct =
    settings.baseAnnualTons > 0
      ? ((settings.baseAnnualTons - annualizedTons) / settings.baseAnnualTons) * 100
      : 0;

  return (
    <Card>
      <CardHeader className="flex-row items-start gap-2">
        <Target className="mt-0.5 h-5 w-5 text-primary" />
        <div>
          <CardTitle>감축 목표 진척도</CardTitle>
          <CardDescription>
            기준연도 대비 연 환산 배출량을 비교해 페이스를 평가합니다. (브라우저에 저장)
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="target-base-year">기준연도</Label>
            <Input
              id="target-base-year"
              type="number"
              min={2000}
              max={2100}
              value={settings.baseYear}
              onChange={(e) =>
                setSettings((p) => ({ ...p, baseYear: Number(e.target.value) || p.baseYear }))
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="target-base-tons">기준 연 배출량</Label>
            <Input
              id="target-base-tons"
              type="number"
              min={0}
              step="0.1"
              value={settings.baseAnnualTons}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  baseAnnualTons: Number(e.target.value) || 0,
                }))
              }
            />
            <FieldHint>tCO2e (자동 추정값으로 채울 수 있습니다 ↓)</FieldHint>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="target-year">목표연도</Label>
            <Input
              id="target-year"
              type="number"
              min={2000}
              max={2100}
              value={settings.targetYear}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  targetYear: Number(e.target.value) || p.targetYear,
                }))
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="target-reduction">감축률 (%)</Label>
            <Input
              id="target-reduction"
              type="number"
              min={0}
              max={100}
              step="1"
              value={settings.targetReductionPct}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  targetReductionPct: Number(e.target.value) || 0,
                }))
              }
            />
          </div>
        </div>

        {monthsCount > 0 ? (
          <button
            type="button"
            className="self-start text-xs text-primary underline-offset-2 hover:underline"
            onClick={() =>
              setSettings((p) => ({
                ...p,
                baseAnnualTons: Number(annualizedTons.toFixed(2)),
              }))
            }
          >
            현재 데이터를 기준값으로 사용 ({annualizedTons.toFixed(2)} tCO2e/년 추정)
          </button>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <div className="text-xs text-muted-foreground">목표 ({settings.targetYear})</div>
            <div className="text-lg font-semibold">
              {formatCO2e(targetAnnualTons * 1000, { unit: 'tCO2e' })}
            </div>
            <div className="text-xs text-muted-foreground">
              기준 대비 −{settings.targetReductionPct}%
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <div className="text-xs text-muted-foreground">
              현재 페이스 ({nowYear} 기대값)
            </div>
            <div className="text-lg font-semibold">
              {formatCO2e(paceTargetTons * 1000, { unit: 'tCO2e' })}
            </div>
            <div className="text-xs text-muted-foreground">
              경과 {yearsElapsed}/{span}년 · 선형 감축 가정
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <div className="text-xs text-muted-foreground">현재 연환산</div>
            <div className="text-lg font-semibold">
              {monthsCount > 0
                ? formatCO2e(annualizedKg, { unit: 'tCO2e' })
                : '-'}
            </div>
            <div className="text-xs text-muted-foreground">
              {monthsCount > 0
                ? `${monthsCount}개월 데이터 기반 환산`
                : '데이터가 없습니다'}
            </div>
          </div>
        </div>

        <div
          className={
            'flex items-start gap-2.5 rounded-lg border p-3 text-sm ' + TONE_STYLES[status.tone]
          }
        >
          <status.Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div className="flex flex-col gap-0.5">
            <div className="font-medium">{status.label}</div>
            {monthsCount > 0 && settings.baseAnnualTons > 0 ? (
              <div className="text-xs">
                기준 대비{' '}
                <span className="font-semibold tabular-nums">
                  {reductionAchievedPct >= 0 ? '−' : '+'}
                  {Math.abs(reductionAchievedPct).toFixed(1)}%
                </span>{' '}
                · 목표 달성까지{' '}
                <span className="font-semibold tabular-nums">
                  {Math.max(0, settings.targetReductionPct - reductionAchievedPct).toFixed(1)}%p
                </span>{' '}
                남음
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
