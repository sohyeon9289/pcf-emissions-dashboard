import type { GhgScopeCode } from '@/lib/domain';

export type FactorVersionView = {
  id: string;
  factorId: string;
  version: number;
  value: number;
  validFrom: string; // ISO date
  validTo: string | null;
  note?: string | null;
};

export type EmissionFactorView = {
  id: string;
  typeKey: string;
  description: string;
  unit: string; // e.g. "kgCO2e/kWh"
  numerator: string; // "kgCO2e"
  denominator: string; // "kWh"
  source?: string | null;
  versions: FactorVersionView[];
};

export type ActivityTypeView = {
  key: string;
  label: string;
  scope: GhgScopeCode;
  category?: string | null;
  defaultUnit: string;
  description?: string | null;
};

export type CompanyView = {
  id: string;
  name: string;
  countryCode: string;
  description?: string | null;
};

export type ActivityView = {
  id: string;
  companyId: string;
  typeKey: string;
  date: string; // YYYY-MM-DD
  description?: string | null;
  amount: number;
  unit: string;
  source?: string | null;
};

/**
 * 한 건의 활동에 대한 계산 결과.
 */
export type EmissionResult = {
  activityId: string;
  companyId: string;
  typeKey: string;
  scope: GhgScopeCode;
  yearMonth: string; // "YYYY-MM"
  emissionsKg: number; // kgCO2e
  factorVersionId: string | null;
  factorValue: number | null;
  warning?: string | null;
};

/**
 * 월별 집계 (시계열 차트용).
 */
export type MonthlySeriesPoint = {
  yearMonth: string;
  total: number;
  byScope: Record<GhgScopeCode, number>;
};

export type ScopeBreakdown = {
  scope: GhgScopeCode;
  emissionsKg: number;
  share: number; // 0~1
};

export type CompanyBreakdown = {
  companyId: string;
  companyName: string;
  emissionsKg: number;
  share: number;
};

export type TypeBreakdown = {
  typeKey: string;
  label: string;
  scope: GhgScopeCode;
  emissionsKg: number;
  share: number;
};
