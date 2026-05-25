import * as React from 'react';
import { AlertTriangle, Inbox, RotateCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

export function EmptyState({
  title = '데이터가 없습니다.',
  description,
  action,
  className,
}: {
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center',
        className,
      )}
    >
      <Inbox className="h-8 w-8 text-muted-foreground" aria-hidden />
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

export function ErrorState({
  title = '데이터를 불러오지 못했습니다.',
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center',
        className,
      )}
      role="alert"
    >
      <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden />
      <div>
        <h3 className="text-sm font-semibold text-destructive">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs text-destructive/80">{description}</p>
        ) : null}
      </div>
      {onRetry ? (
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RotateCw className="h-3 w-3" /> 다시 시도
        </Button>
      ) : null}
    </div>
  );
}
