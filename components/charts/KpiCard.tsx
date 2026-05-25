import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  trend?: { value: number; positiveIsBad?: boolean; label?: string };
  className?: string;
}) {
  const isUp = trend ? trend.value > 0 : false;
  const isBad = trend ? (trend.positiveIsBad ? isUp : !isUp) : false;
  return (
    <Card className={className}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
            {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
          </div>
          {Icon ? (
            <div className="rounded-md bg-muted p-2 text-muted-foreground">
              <Icon className="h-4 w-4" aria-hidden />
            </div>
          ) : null}
        </div>
        {trend ? (
          <div
            className={cn(
              'mt-3 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium',
              isBad ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success',
            )}
          >
            {isUp ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {(trend.value * 100).toFixed(1)}%
            {trend.label ? <span className="ml-0.5 text-muted-foreground">{trend.label}</span> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
