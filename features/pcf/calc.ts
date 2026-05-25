/**
 * PCF 계산 코어
 *
 * 산식:
 *   emissionsKg = convertedAmount(activity.amount, activity.unit -> factor.denominator)
 *               * factorVersion.value
 *
 * factor version 선택:
 *   - validFrom <= activity.date < (validTo ?? +Infinity)
 *   - 같은 시점에 여러 후보가 있으면 가장 최신 version 사용
 */

import type { GhgScopeCode } from '@/lib/domain';
import { convertToFactorDenominator } from '@/lib/units';
import type {
  ActivityTypeView,
  ActivityView,
  EmissionFactorView,
  EmissionResult,
  CompanyBreakdown,
  CompanyView,
  FactorVersionView,
  MonthlySeriesPoint,
  ScopeBreakdown,
  TypeBreakdown,
} from './types';

export function pickFactorVersion(
  factor: EmissionFactorView | null | undefined,
  date: string | Date,
): FactorVersionView | null {
  if (!factor || factor.versions.length === 0) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  const ts = d.getTime();
  const eligible = factor.versions.filter((v) => {
    const fromTs = new Date(v.validFrom).getTime();
    const toTs = v.validTo ? new Date(v.validTo).getTime() : Number.POSITIVE_INFINITY;
    return fromTs <= ts && ts < toTs;
  });
  if (eligible.length === 0) return null;
  return eligible.reduce((acc, cur) => (cur.version > acc.version ? cur : acc), eligible[0]!);
}

/**
 * 한 건의 활동 -> 배출량(kgCO2e). factor 미존재 또는 단위 불일치면 warning과 함께 0 반환.
 */
export function calcActivityEmission(
  activity: ActivityView,
  type: ActivityTypeView,
  factor: EmissionFactorView | null,
): EmissionResult {
  const ym = toYearMonth(activity.date);
  if (!factor) {
    return {
      activityId: activity.id,
      companyId: activity.companyId,
      typeKey: activity.typeKey,
      scope: type.scope,
      yearMonth: ym,
      emissionsKg: 0,
      factorVersionId: null,
      factorValue: null,
      warning: '배출계수가 등록되지 않았습니다.',
    };
  }
  const version = pickFactorVersion(factor, activity.date);
  if (!version) {
    return {
      activityId: activity.id,
      companyId: activity.companyId,
      typeKey: activity.typeKey,
      scope: type.scope,
      yearMonth: ym,
      emissionsKg: 0,
      factorVersionId: null,
      factorValue: null,
      warning: `해당 일자(${activity.date})에 적용 가능한 배출계수 버전이 없습니다.`,
    };
  }
  try {
    const converted = convertToFactorDenominator(activity.amount, activity.unit, factor.denominator);
    const emissionsKg = converted * version.value;
    return {
      activityId: activity.id,
      companyId: activity.companyId,
      typeKey: activity.typeKey,
      scope: type.scope,
      yearMonth: ym,
      emissionsKg,
      factorVersionId: version.id,
      factorValue: version.value,
    };
  } catch (err) {
    return {
      activityId: activity.id,
      companyId: activity.companyId,
      typeKey: activity.typeKey,
      scope: type.scope,
      yearMonth: ym,
      emissionsKg: 0,
      factorVersionId: version.id,
      factorValue: version.value,
      warning: err instanceof Error ? err.message : '단위 변환 실패',
    };
  }
}

export function calcAll(
  activities: ActivityView[],
  typesByKey: Record<string, ActivityTypeView>,
  factorsByTypeKey: Record<string, EmissionFactorView>,
): EmissionResult[] {
  return activities.map((a) => {
    const type = typesByKey[a.typeKey];
    if (!type) {
      return {
        activityId: a.id,
        companyId: a.companyId,
        typeKey: a.typeKey,
        scope: 'SCOPE_3' as GhgScopeCode,
        yearMonth: toYearMonth(a.date),
        emissionsKg: 0,
        factorVersionId: null,
        factorValue: null,
        warning: `알 수 없는 활동 유형 (${a.typeKey})`,
      };
    }
    return calcActivityEmission(a, type, factorsByTypeKey[a.typeKey] ?? null);
  });
}

export function aggregateByMonth(results: EmissionResult[]): MonthlySeriesPoint[] {
  const map = new Map<string, MonthlySeriesPoint>();
  for (const r of results) {
    let pt = map.get(r.yearMonth);
    if (!pt) {
      pt = {
        yearMonth: r.yearMonth,
        total: 0,
        byScope: { SCOPE_1: 0, SCOPE_2: 0, SCOPE_3: 0 },
      };
      map.set(r.yearMonth, pt);
    }
    pt.total += r.emissionsKg;
    pt.byScope[r.scope] += r.emissionsKg;
  }
  return [...map.values()].sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
}

export function aggregateByScope(results: EmissionResult[]): ScopeBreakdown[] {
  const totals: Record<GhgScopeCode, number> = { SCOPE_1: 0, SCOPE_2: 0, SCOPE_3: 0 };
  let grand = 0;
  for (const r of results) {
    totals[r.scope] += r.emissionsKg;
    grand += r.emissionsKg;
  }
  return (['SCOPE_1', 'SCOPE_2', 'SCOPE_3'] as const).map((scope) => ({
    scope,
    emissionsKg: totals[scope],
    share: grand > 0 ? totals[scope] / grand : 0,
  }));
}

export function aggregateByCompany(
  results: EmissionResult[],
  companies: CompanyView[],
): CompanyBreakdown[] {
  const nameMap = new Map(companies.map((c) => [c.id, c.name]));
  const totals = new Map<string, number>();
  let grand = 0;
  for (const r of results) {
    totals.set(r.companyId, (totals.get(r.companyId) ?? 0) + r.emissionsKg);
    grand += r.emissionsKg;
  }
  return [...totals.entries()]
    .map(([companyId, emissionsKg]) => ({
      companyId,
      companyName: nameMap.get(companyId) ?? companyId,
      emissionsKg,
      share: grand > 0 ? emissionsKg / grand : 0,
    }))
    .sort((a, b) => b.emissionsKg - a.emissionsKg);
}

export function aggregateByType(
  results: EmissionResult[],
  typesByKey: Record<string, ActivityTypeView>,
): TypeBreakdown[] {
  const totals = new Map<string, number>();
  let grand = 0;
  for (const r of results) {
    totals.set(r.typeKey, (totals.get(r.typeKey) ?? 0) + r.emissionsKg);
    grand += r.emissionsKg;
  }
  return [...totals.entries()]
    .map(([typeKey, emissionsKg]) => {
      const t = typesByKey[typeKey];
      return {
        typeKey,
        label: t?.label ?? typeKey,
        scope: t?.scope ?? ('SCOPE_3' as GhgScopeCode),
        emissionsKg,
        share: grand > 0 ? emissionsKg / grand : 0,
      };
    })
    .sort((a, b) => b.emissionsKg - a.emissionsKg);
}

export function totalEmissionsKg(results: EmissionResult[]): number {
  return results.reduce((s, r) => s + r.emissionsKg, 0);
}

export function toYearMonth(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const y = d.getUTCFullYear();
  const m = `${d.getUTCMonth() + 1}`.padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * 전월 대비 변화율 (음수: 감소, 양수: 증가). 데이터 부족 시 null.
 */
export function momChange(series: MonthlySeriesPoint[]): { from: string; to: string; change: number } | null {
  if (series.length < 2) return null;
  const last = series[series.length - 1]!;
  const prev = series[series.length - 2]!;
  if (prev.total === 0) return null;
  return {
    from: prev.yearMonth,
    to: last.yearMonth,
    change: (last.total - prev.total) / prev.total,
  };
}
