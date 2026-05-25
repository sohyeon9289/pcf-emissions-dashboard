'use client';

import { Trash2 } from 'lucide-react';
import { ActivityForm } from '@/components/forms/ActivityForm';
import { FilterBar } from '@/components/filters/FilterBar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ScopeBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table';
import { useDeleteActivity } from '@/features/pcf/mutations';
import { useFilterUrl } from '@/features/filters/useFilterUrl';
import { useEmissions } from '@/features/pcf/useEmissions';
import { formatAmount, formatCO2e } from '@/lib/units';

export default function ActivitiesPage() {
  const { filter } = useFilterUrl();
  const { activities, results, typesByKey, companies, isLoading, error, refetch } =
    useEmissions(filter);
  const del = useDeleteActivity();
  const companyMap = new Map(companies.map((c) => [c.id, c.name]));
  const resultMap = new Map(results.map((r) => [r.activityId, r]));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">활동 데이터</h1>
        <p className="text-sm text-muted-foreground">
          활동량 + 배출계수(자동 매칭) → 실시간 배출량 계산. 저장 실패 시 자동 롤백.
        </p>
      </div>

      <ActivityForm />

      <FilterBar />

      <Card>
        <CardHeader>
          <CardTitle>활동 목록</CardTitle>
          <CardDescription>
            총 {activities.length.toLocaleString()} 건 · 필터 적용 결과.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <ErrorState
              description={error instanceof Error ? error.message : String(error)}
              onRetry={refetch}
            />
          ) : isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <EmptyState description="필터에 해당하는 활동이 없습니다." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>일자</TH>
                  <TH>회사</TH>
                  <TH>유형 / Scope</TH>
                  <TH>설명</TH>
                  <TH className="text-right">활동량</TH>
                  <TH className="text-right">배출량</TH>
                  <TH className="w-8" />
                </TR>
              </THead>
              <TBody>
                {activities.map((a) => {
                  const t = typesByKey[a.typeKey];
                  const r = resultMap.get(a.id);
                  return (
                    <TR key={a.id}>
                      <TD className="whitespace-nowrap font-mono text-xs">{a.date}</TD>
                      <TD className="whitespace-nowrap">{companyMap.get(a.companyId) ?? a.companyId}</TD>
                      <TD>
                        <div className="flex items-center gap-1.5">
                          {t ? <ScopeBadge scope={t.scope} /> : null}
                          <span>{t?.label ?? a.typeKey}</span>
                        </div>
                      </TD>
                      <TD className="text-xs text-muted-foreground">{a.description ?? '-'}</TD>
                      <TD className="text-right tabular-nums">
                        {formatAmount(a.amount, a.unit)}
                      </TD>
                      <TD className="text-right tabular-nums">
                        {r?.warning ? (
                          <span className="text-xs text-destructive">{r.warning}</span>
                        ) : (
                          formatCO2e(r?.emissionsKg ?? 0)
                        )}
                      </TD>
                      <TD>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="삭제"
                          loading={del.isPending && del.variables === a.id}
                          onClick={() => {
                            if (confirm('이 활동 데이터를 삭제할까요?')) {
                              del.mutate(a.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
