'use client';

import dynamic from 'next/dynamic';
import { Activity, Building2, Flame, Leaf } from 'lucide-react';
import { FilterBar } from '@/components/filters/FilterBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { KpiCard } from '@/components/charts/KpiCard';
import { CompanyRanking } from '@/components/charts/CompanyRanking';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useFilterUrl } from '@/features/filters/useFilterUrl';
import { useEmissions } from '@/features/pcf/useEmissions';
import { formatCO2e } from '@/lib/units';

const MonthlyTrend = dynamic(
  () => import('@/components/charts/MonthlyTrend').then((m) => m.MonthlyTrend),
  { ssr: false, loading: () => <div className="h-[280px] animate-pulse rounded-md bg-muted" /> },
);
const ScopeDonut = dynamic(
  () => import('@/components/charts/ScopeDonut').then((m) => m.ScopeDonut),
  { ssr: false, loading: () => <div className="h-[220px] animate-pulse rounded-md bg-muted" /> },
);
const TypeBar = dynamic(
  () => import('@/components/charts/TypeBar').then((m) => m.TypeBar),
  { ssr: false, loading: () => <div className="h-[280px] animate-pulse rounded-md bg-muted" /> },
);

export function DashboardPage() {
  const { filter } = useFilterUrl();
  const { isLoading, error, refetch, monthly, byScope, byType, byCompany, total, mom, results } =
    useEmissions(filter);

  const warnings = results.filter((r) => r.warning).length;
  const scope2 = byScope.find((s) => s.scope === 'SCOPE_2');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Overview</h1>
          <p className="text-sm text-muted-foreground">
            활동 데이터에 배출계수(버전)를 적용해 자동 계산된 PCF 시계열·구성·랭킹.
          </p>
        </div>
      </div>

      <FilterBar />

      {error ? (
        <ErrorState
          description={error instanceof Error ? error.message : String(error)}
          onRetry={refetch}
        />
      ) : null}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <KpiCard
              icon={Flame}
              label="총 배출량"
              value={formatCO2e(total, { unit: 'tCO2e' })}
              hint="필터 적용 범위 기준"
              trend={
                mom
                  ? {
                      value: mom.change,
                      positiveIsBad: true,
                      label: `(${mom.from} → ${mom.to})`,
                    }
                  : undefined
              }
            />
            <KpiCard
              icon={Leaf}
              label="Scope 2 (전력)"
              value={formatCO2e(scope2?.emissionsKg ?? 0, { unit: 'tCO2e' })}
              hint={`전체의 ${((scope2?.share ?? 0) * 100).toFixed(1)}%`}
            />
            <KpiCard
              icon={Activity}
              label="활동 건수"
              value={`${results.length.toLocaleString()} 건`}
              hint={warnings > 0 ? `경고 ${warnings} 건` : '경고 없음'}
            />
            <KpiCard
              icon={Building2}
              label="회사 수"
              value={`${byCompany.length} 곳`}
              hint="필터 적용 후 집계 대상"
            />
          </>
        )}
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>월별 배출량 추이</CardTitle>
            <CardDescription>Scope 1·2·3 누적 영역 (단위: tCO2e)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : monthly.length === 0 ? (
              <EmptyState description="필터에 해당하는 월별 데이터가 없습니다." />
            ) : (
              <MonthlyTrend data={monthly} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Scope 구성</CardTitle>
            <CardDescription>전체 배출량의 Scope 비중</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : total === 0 ? (
              <EmptyState description="배출량 데이터가 없습니다." />
            ) : (
              <ScopeDonut data={byScope} />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>활동 유형별 배출 (Top 8)</CardTitle>
            <CardDescription>Scope 색상으로 구분된 활동 유형 막대그래프</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : byType.length === 0 ? (
              <EmptyState />
            ) : (
              <TypeBar data={byType} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>회사별 랭킹</CardTitle>
            <CardDescription>필터 범위 내 회사별 배출량 비교</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <CompanyRanking data={byCompany} />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
