/**
 * useEmissions
 *
 * 필터된 활동 + 활동유형 + 배출계수 → 계산 결과(EmissionResult[])와 각종 집계를 메모이즈.
 * UI 측은 이 훅 하나로 차트/표/카드에 필요한 모든 가공 데이터를 얻는다.
 */
'use client';

import { useMemo } from 'react';
import {
  aggregateByCompany,
  aggregateByMonth,
  aggregateByScope,
  aggregateByType,
  calcAll,
  momChange,
  totalEmissionsKg,
} from './calc';
import type {
  ActivityTypeView,
  ActivityView,
  CompanyView,
  EmissionFactorView,
} from './types';
import { useActivities, useActivityTypes, useCompanies, useEmissionFactors } from './queries';
import type { ActivityFilterInput } from '@/lib/validation';
import type {
  ActivityDto,
  ActivityTypeDto,
  CompanyDto,
  EmissionFactorDto,
} from './api';

function dtoToActivityView(a: ActivityDto): ActivityView {
  return {
    id: a.id,
    companyId: a.companyId,
    typeKey: a.typeKey,
    date: typeof a.date === 'string' ? a.date.slice(0, 10) : a.date,
    description: a.description ?? null,
    amount: a.amount,
    unit: a.unit,
    source: a.source ?? null,
  };
}

function dtoToTypeView(t: ActivityTypeDto): ActivityTypeView {
  return {
    key: t.key,
    label: t.label,
    scope: t.scope,
    category: t.category ?? null,
    defaultUnit: t.defaultUnit,
    description: t.description ?? null,
  };
}

function dtoToCompanyView(c: CompanyDto): CompanyView {
  return {
    id: c.id,
    name: c.name,
    countryCode: c.countryCode,
    description: c.description ?? null,
  };
}

function dtoToFactorView(f: EmissionFactorDto): EmissionFactorView {
  return {
    id: f.id,
    typeKey: f.typeKey,
    description: f.description,
    unit: f.unit,
    numerator: f.numerator,
    denominator: f.denominator,
    source: f.source ?? null,
    versions: f.versions.map((v) => ({
      id: v.id,
      factorId: v.factorId,
      version: v.version,
      value: v.value,
      validFrom: typeof v.validFrom === 'string' ? v.validFrom.slice(0, 10) : v.validFrom,
      validTo: v.validTo ? (typeof v.validTo === 'string' ? v.validTo.slice(0, 10) : v.validTo) : null,
      note: v.note ?? null,
    })),
  };
}

export function useEmissions(filter: ActivityFilterInput = {}) {
  const activitiesQ = useActivities(filter);
  const typesQ = useActivityTypes();
  const factorsQ = useEmissionFactors();
  const companiesQ = useCompanies();

  const isLoading =
    activitiesQ.isLoading || typesQ.isLoading || factorsQ.isLoading || companiesQ.isLoading;
  const isFetching =
    activitiesQ.isFetching || typesQ.isFetching || factorsQ.isFetching || companiesQ.isFetching;
  const error =
    activitiesQ.error ?? typesQ.error ?? factorsQ.error ?? companiesQ.error ?? null;

  const data = useMemo(() => {
    const activities = (activitiesQ.data ?? []).map(dtoToActivityView);
    const typesByKey: Record<string, ActivityTypeView> = Object.fromEntries(
      (typesQ.data ?? []).map((t) => [t.key, dtoToTypeView(t)]),
    );
    const factorsByTypeKey: Record<string, EmissionFactorView> = Object.fromEntries(
      (factorsQ.data ?? []).map((f) => [f.typeKey, dtoToFactorView(f)]),
    );
    const companies = (companiesQ.data ?? []).map(dtoToCompanyView);

    const results = calcAll(activities, typesByKey, factorsByTypeKey);
    const monthly = aggregateByMonth(results);
    const byScope = aggregateByScope(results);
    const byCompany = aggregateByCompany(results, companies);
    const byType = aggregateByType(results, typesByKey);
    const total = totalEmissionsKg(results);
    const mom = momChange(monthly);

    return {
      results,
      monthly,
      byScope,
      byCompany,
      byType,
      total,
      mom,
      typesByKey,
      factorsByTypeKey,
      companies,
      activities,
    };
  }, [activitiesQ.data, typesQ.data, factorsQ.data, companiesQ.data]);

  const refetch = () => {
    activitiesQ.refetch();
    typesQ.refetch();
    factorsQ.refetch();
    companiesQ.refetch();
  };

  return { ...data, isLoading, isFetching, error, refetch };
}
