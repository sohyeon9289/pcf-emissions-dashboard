'use client';

import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCompanies } from '@/features/pcf/queries';
import { useEmissions } from '@/features/pcf/useEmissions';
import { formatCO2e } from '@/lib/units';

export default function CompaniesPage() {
  const companies = useCompanies();
  const { byCompany, isLoading } = useEmissions({});

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">회사</h1>
        <p className="text-sm text-muted-foreground">
          회사별 총 PCF · 국가별 분포. 클릭 시 대시보드 필터 적용.
        </p>
      </div>

      {companies.isLoading || isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {companies.data?.map((c) => {
            const row = byCompany.find((b) => b.companyId === c.id);
            return (
              <Link key={c.id} href={`/?companyId=${c.id}`} className="block">
                <Card className="transition-colors hover:border-primary/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {c.name}
                    </CardTitle>
                    <CardDescription>
                      <Badge tone="muted">{c.countryCode}</Badge>{' '}
                      {c.description ?? ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      총 배출량
                    </p>
                    <p className="text-2xl font-bold tracking-tight">
                      {formatCO2e(row?.emissionsKg ?? 0, { unit: 'tCO2e' })}
                    </p>
                    {row ? (
                      <p className="text-xs text-muted-foreground">
                        전체의 {(row.share * 100).toFixed(1)}%
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
