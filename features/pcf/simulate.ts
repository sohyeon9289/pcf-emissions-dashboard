/**
 * What-if 시나리오 시뮬레이션 (시연용 — 클라이언트 전용, DB 비저장).
 *
 * 기존 calc.ts 의 순수 함수를 그대로 재사용하기 위해
 * "활동 데이터를 변형 -> calcAll 다시 호출" 전략을 사용한다.
 *
 * 지원하는 변경(ScenarioChange):
 *  - REDUCE_AMOUNT       : 특정 활동 유형의 활동량을 X% 감축
 *  - SUBSTITUTE_TYPE     : 활동 유형 A -> B 로 X% 전환 (재생에너지 전환 등)
 *
 * 모든 변경은 누적 적용이 아니라 입력 활동을 한 번씩 변형한다.
 */
import {
  aggregateByCompany,
  aggregateByMonth,
  aggregateByScope,
  aggregateByType,
  calcAll,
  totalEmissionsKg,
} from './calc';
import type {
  ActivityTypeView,
  ActivityView,
  CompanyView,
  EmissionFactorView,
  MonthlySeriesPoint,
} from './types';

export type ScenarioChange =
  | { type: 'REDUCE_AMOUNT'; typeKey: string; reductionPct: number }
  | {
      type: 'SUBSTITUTE_TYPE';
      fromTypeKey: string;
      toTypeKey: string;
      sharePct: number;
    };

export type ScenarioInput = {
  activities: ActivityView[];
  typesByKey: Record<string, ActivityTypeView>;
  factorsByTypeKey: Record<string, EmissionFactorView>;
  companies: CompanyView[];
  changes: ScenarioChange[];
};

export type ScenarioResult = {
  baselineKg: number;
  scenarioKg: number;
  deltaKg: number;
  deltaPct: number;
  baselineMonthly: MonthlySeriesPoint[];
  scenarioMonthly: MonthlySeriesPoint[];
  scenarioByScope: ReturnType<typeof aggregateByScope>;
  scenarioByType: ReturnType<typeof aggregateByType>;
  scenarioByCompany: ReturnType<typeof aggregateByCompany>;
};

function applyChanges(
  activities: ActivityView[],
  changes: ScenarioChange[],
): ActivityView[] {
  if (changes.length === 0) return activities;

  return activities.flatMap((a): ActivityView[] => {
    let current = a;
    const split: ActivityView[] = [];

    for (const change of changes) {
      if (change.type === 'REDUCE_AMOUNT' && current.typeKey === change.typeKey) {
        const factor = 1 - change.reductionPct / 100;
        current = { ...current, amount: current.amount * factor };
      }
      if (
        change.type === 'SUBSTITUTE_TYPE' &&
        current.typeKey === change.fromTypeKey &&
        change.sharePct > 0
      ) {
        const sharePct = Math.min(100, Math.max(0, change.sharePct));
        const switchedAmount = current.amount * (sharePct / 100);
        const remainingAmount = current.amount * (1 - sharePct / 100);
        if (switchedAmount > 0) {
          split.push({
            ...current,
            id: `${current.id}__sub__${change.toTypeKey}`,
            typeKey: change.toTypeKey,
            amount: switchedAmount,
          });
        }
        current = { ...current, amount: remainingAmount };
      }
    }

    return [current, ...split];
  });
}

export function simulateScenario(input: ScenarioInput): ScenarioResult {
  const { activities, typesByKey, factorsByTypeKey, companies, changes } = input;

  const baselineResults = calcAll(activities, typesByKey, factorsByTypeKey);
  const baselineKg = totalEmissionsKg(baselineResults);
  const baselineMonthly = aggregateByMonth(baselineResults);

  const scenarioActivities = applyChanges(activities, changes);
  const scenarioResults = calcAll(scenarioActivities, typesByKey, factorsByTypeKey);
  const scenarioKg = totalEmissionsKg(scenarioResults);

  return {
    baselineKg,
    scenarioKg,
    deltaKg: scenarioKg - baselineKg,
    deltaPct: baselineKg > 0 ? (scenarioKg - baselineKg) / baselineKg : 0,
    baselineMonthly,
    scenarioMonthly: aggregateByMonth(scenarioResults),
    scenarioByScope: aggregateByScope(scenarioResults),
    scenarioByType: aggregateByType(scenarioResults, typesByKey),
    scenarioByCompany: aggregateByCompany(scenarioResults, companies),
  };
}
