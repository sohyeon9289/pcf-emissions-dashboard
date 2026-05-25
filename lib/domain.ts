/**
 * 도메인 상수 — GHG Scope, 활동 유형 라벨, 단위 후보 등
 */

export const GHG_SCOPES = ['SCOPE_1', 'SCOPE_2', 'SCOPE_3'] as const;
export type GhgScopeCode = (typeof GHG_SCOPES)[number];

export const SCOPE_LABEL: Record<GhgScopeCode, string> = {
  SCOPE_1: 'Scope 1 (직접 배출)',
  SCOPE_2: 'Scope 2 (간접 - 전력)',
  SCOPE_3: 'Scope 3 (가치사슬)',
};

export const SCOPE_DESCRIPTION: Record<GhgScopeCode, string> = {
  SCOPE_1: '회사가 직접 보유·통제하는 배출원의 직접 배출 (예: 보일러, 차량 연료 연소)',
  SCOPE_2: '구매한 전기·열·증기 사용에 따른 간접 배출 (예: 한국전력 전력 사용)',
  SCOPE_3: '가치사슬상의 기타 간접 배출 (구매 제품·서비스, 운송, 폐기물 등)',
};

export const SCOPE_COLOR_VAR: Record<GhgScopeCode, string> = {
  SCOPE_1: 'hsl(var(--scope-1))',
  SCOPE_2: 'hsl(var(--scope-2))',
  SCOPE_3: 'hsl(var(--scope-3))',
};

export const UNIT_BY_DENOMINATOR: Record<string, string[]> = {
  kWh: ['kWh', 'MWh'],
  kg: ['kg', 'ton'],
  'ton-km': ['ton-km'],
  L: ['L', 'kL'],
};

export const PCF_OUTPUT_UNIT = 'tCO2e' as const;
export const PCF_BASE_UNIT = 'kgCO2e' as const;
