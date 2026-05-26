'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScopeBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { FactorVersionTimeline } from '@/components/factors/FactorVersionTimeline';
import { NewFactorVersionForm } from '@/components/forms/NewFactorVersionForm';
import { EmissionFactorForm } from '@/components/forms/EmissionFactorForm';
import { useActivityTypes, useEmissionFactors } from '@/features/pcf/queries';

export default function FactorsPage() {
  const factors = useEmissionFactors();
  const types = useActivityTypes();
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [showFactorForm, setShowFactorForm] = React.useState(false);
  const typeByKey = new Map((types.data ?? []).map((t) => [t.key, t]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">배출계수 관리</h1>
          <p className="text-sm text-muted-foreground">
            활동 일자에 맞는 계수가 자동 적용됩니다. 새 버전 등록 시 이전 버전의 유효 종료일이 자동
            갱신됩니다.
          </p>
        </div>
        <Button
          variant={showFactorForm ? 'secondary' : 'primary'}
          onClick={() => setShowFactorForm((v) => !v)}
        >
          <Plus className="mr-1 h-4 w-4" />
          {showFactorForm ? '닫기' : '배출계수 추가'}
        </Button>
      </div>

      {showFactorForm ? (
        <Card>
          <CardHeader>
            <CardTitle>새 배출계수</CardTitle>
            <CardDescription>
              활동 유형당 배출계수는 1개. 첫 버전(v1)이 함께 등록되며 이후 새 버전 추가로 시간별
              변경을 관리합니다. 활동 유형이 부족하면 먼저
              <a className="ml-1 underline" href="/activities">
                활동 데이터
              </a>{' '}
              페이지에서 추가하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmissionFactorForm onSuccess={() => setShowFactorForm(false)} />
          </CardContent>
        </Card>
      ) : null}

      {factors.error ? (
        <ErrorState
          description={
            factors.error instanceof Error ? factors.error.message : String(factors.error)
          }
          onRetry={() => factors.refetch()}
        />
      ) : null}

      {factors.isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : factors.data && factors.data.length === 0 ? (
        <EmptyState description="등록된 배출계수가 없습니다." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {factors.data?.map((f) => {
            const t = typeByKey.get(f.typeKey);
            const open = openId === f.id;
            return (
              <Card key={f.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {t ? <ScopeBadge scope={t.scope} /> : null}
                        <span>{f.description}</span>
                      </CardTitle>
                      <CardDescription>
                        단위: <strong>{f.unit}</strong>
                        {f.source ? <> · 출처: {f.source}</> : null}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant={open ? 'secondary' : 'outline'}
                      onClick={() => setOpenId(open ? null : f.id)}
                    >
                      <Plus className="h-3 w-3" /> 새 버전
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FactorVersionTimeline versions={f.versions} unit={f.unit} />
                  {open ? (
                    <div className="rounded-md border border-border bg-muted/30 p-3">
                      <NewFactorVersionForm
                        factorId={f.id}
                        unit={f.unit}
                        currentVersions={f.versions}
                        onDone={() => setOpenId(null)}
                      />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
