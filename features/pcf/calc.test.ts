import { describe, expect, it } from 'vitest';
import {
  aggregateByCompany,
  aggregateByMonth,
  aggregateByScope,
  aggregateByType,
  calcActivityEmission,
  calcAll,
  momChange,
  pickFactorVersion,
  toYearMonth,
  totalEmissionsKg,
} from './calc';
import type { ActivityTypeView, ActivityView, EmissionFactorView } from './types';

const elecType: ActivityTypeView = {
  key: 'electricity_kepco',
  label: '전기 (한국전력)',
  scope: 'SCOPE_2',
  defaultUnit: 'kWh',
};
const truckType: ActivityTypeView = {
  key: 'transport_truck',
  label: '운송 - 트럭',
  scope: 'SCOPE_3',
  defaultUnit: 'ton-km',
};
const dieselType: ActivityTypeView = {
  key: 'diesel',
  label: '디젤',
  scope: 'SCOPE_1',
  defaultUnit: 'L',
};

const elecFactor: EmissionFactorView = {
  id: 'f_elec',
  typeKey: 'electricity_kepco',
  description: '전기',
  unit: 'kgCO2e/kWh',
  numerator: 'kgCO2e',
  denominator: 'kWh',
  versions: [
    { id: 'fv_e1', factorId: 'f_elec', version: 1, value: 0.459, validFrom: '2023-01-01', validTo: '2024-12-31' },
    { id: 'fv_e2', factorId: 'f_elec', version: 2, value: 0.456, validFrom: '2025-01-01', validTo: null },
  ],
};

const truckFactor: EmissionFactorView = {
  id: 'f_truck',
  typeKey: 'transport_truck',
  description: '트럭',
  unit: 'kgCO2e/ton-km',
  numerator: 'kgCO2e',
  denominator: 'ton-km',
  versions: [
    { id: 'fv_t1', factorId: 'f_truck', version: 1, value: 3.5, validFrom: '2023-01-01', validTo: null },
  ],
};

describe('pickFactorVersion', () => {
  it('picks v1 in 2024', () => {
    const v = pickFactorVersion(elecFactor, '2024-06-15');
    expect(v?.version).toBe(1);
  });
  it('picks v2 in 2025', () => {
    const v = pickFactorVersion(elecFactor, '2025-03-01');
    expect(v?.version).toBe(2);
  });
  it('returns null before any version is valid', () => {
    const v = pickFactorVersion(elecFactor, '2020-01-01');
    expect(v).toBeNull();
  });
  it('returns null for empty factor', () => {
    expect(
      pickFactorVersion({ ...elecFactor, versions: [] }, '2025-01-01'),
    ).toBeNull();
  });
});

describe('calcActivityEmission', () => {
  it('multiplies amount and factor (electricity, kWh)', () => {
    const result = calcActivityEmission(
      { id: 'a1', companyId: 'c1', typeKey: 'electricity_kepco', date: '2025-03-01', amount: 100, unit: 'kWh' },
      elecType,
      elecFactor,
    );
    expect(result.emissionsKg).toBeCloseTo(100 * 0.456, 6);
    expect(result.scope).toBe('SCOPE_2');
    expect(result.factorValue).toBe(0.456);
  });

  it('converts MWh → kWh before multiplying', () => {
    const result = calcActivityEmission(
      { id: 'a1', companyId: 'c1', typeKey: 'electricity_kepco', date: '2025-03-01', amount: 1, unit: 'MWh' },
      elecType,
      elecFactor,
    );
    expect(result.emissionsKg).toBeCloseTo(1000 * 0.456, 6);
  });

  it('warns on unit mismatch (kg into kWh factor)', () => {
    const result = calcActivityEmission(
      { id: 'a1', companyId: 'c1', typeKey: 'electricity_kepco', date: '2025-03-01', amount: 100, unit: 'kg' },
      elecType,
      elecFactor,
    );
    expect(result.emissionsKg).toBe(0);
    expect(result.warning).toMatch(/단위 불일치|호환되지 않습니다/);
  });

  it('warns when no factor exists', () => {
    const result = calcActivityEmission(
      { id: 'a1', companyId: 'c1', typeKey: 'diesel', date: '2025-03-01', amount: 100, unit: 'L' },
      dieselType,
      null,
    );
    expect(result.warning).toMatch(/배출계수가 등록되지 않았습니다/);
    expect(result.emissionsKg).toBe(0);
  });

  it('warns when no valid version', () => {
    const result = calcActivityEmission(
      { id: 'a1', companyId: 'c1', typeKey: 'electricity_kepco', date: '2020-01-01', amount: 100, unit: 'kWh' },
      elecType,
      elecFactor,
    );
    expect(result.warning).toMatch(/적용 가능한 배출계수 버전이 없습니다/);
  });
});

describe('aggregations', () => {
  const activities: ActivityView[] = [
    { id: 'a1', companyId: 'c1', typeKey: 'electricity_kepco', date: '2025-01-01', amount: 100, unit: 'kWh' },
    { id: 'a2', companyId: 'c1', typeKey: 'electricity_kepco', date: '2025-02-01', amount: 200, unit: 'kWh' },
    { id: 'a3', companyId: 'c1', typeKey: 'transport_truck', date: '2025-01-01', amount: 50, unit: 'ton-km' },
    { id: 'a4', companyId: 'c2', typeKey: 'electricity_kepco', date: '2025-02-01', amount: 300, unit: 'kWh' },
  ];
  const typesByKey = {
    electricity_kepco: elecType,
    transport_truck: truckType,
  };
  const factorsByTypeKey = {
    electricity_kepco: elecFactor,
    transport_truck: truckFactor,
  };

  const results = calcAll(activities, typesByKey, factorsByTypeKey);

  it('totals match expected', () => {
    const expectedTotal =
      100 * 0.456 + 200 * 0.456 + 50 * 3.5 + 300 * 0.456;
    expect(totalEmissionsKg(results)).toBeCloseTo(expectedTotal, 6);
  });

  it('aggregateByMonth groups correctly', () => {
    const monthly = aggregateByMonth(results);
    const jan = monthly.find((m) => m.yearMonth === '2025-01')!;
    const feb = monthly.find((m) => m.yearMonth === '2025-02')!;
    expect(jan.total).toBeCloseTo(100 * 0.456 + 50 * 3.5, 6);
    expect(jan.byScope.SCOPE_2).toBeCloseTo(100 * 0.456, 6);
    expect(jan.byScope.SCOPE_3).toBeCloseTo(50 * 3.5, 6);
    expect(feb.total).toBeCloseTo((200 + 300) * 0.456, 6);
  });

  it('aggregateByScope shares sum to 1', () => {
    const scopes = aggregateByScope(results);
    const sum = scopes.reduce((s, r) => s + r.share, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  it('aggregateByCompany ranks correctly', () => {
    const ranked = aggregateByCompany(results, [
      { id: 'c1', name: 'Acme', countryCode: 'US' },
      { id: 'c2', name: 'Globex', countryCode: 'DE' },
    ]);
    expect(ranked[0]!.companyId).toBe('c1');
    expect(ranked[1]!.companyId).toBe('c2');
  });

  it('aggregateByType ranks correctly', () => {
    const ranked = aggregateByType(results, typesByKey);
    expect(ranked[0]!.typeKey).toBe('electricity_kepco');
  });

  it('momChange returns null when too few months', () => {
    expect(momChange([])).toBeNull();
  });

  it('momChange computes percentage', () => {
    const change = momChange([
      { yearMonth: '2025-01', total: 100, byScope: { SCOPE_1: 0, SCOPE_2: 100, SCOPE_3: 0 } },
      { yearMonth: '2025-02', total: 150, byScope: { SCOPE_1: 0, SCOPE_2: 150, SCOPE_3: 0 } },
    ]);
    expect(change?.change).toBeCloseTo(0.5, 6);
  });
});

describe('toYearMonth', () => {
  it('formats date string', () => {
    expect(toYearMonth('2025-03-15')).toBe('2025-03');
  });
});
