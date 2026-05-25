import * as React from 'react';
import { cn } from '@/lib/cn';
import type { GhgScopeCode } from '@/lib/domain';

type Tone = 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'destructive' | 'muted';

const TONES: Record<Tone, string> = {
  default: 'bg-muted text-foreground',
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent/10 text-accent',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  destructive: 'bg-destructive/15 text-destructive',
  muted: 'bg-muted text-muted-foreground',
};

export function Badge({
  tone = 'default',
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

const SCOPE_TONE: Record<GhgScopeCode, string> = {
  SCOPE_1: 'bg-scope-1/15 text-scope-1',
  SCOPE_2: 'bg-scope-2/15 text-scope-2',
  SCOPE_3: 'bg-scope-3/15 text-scope-3',
};

const SCOPE_LABEL_SHORT: Record<GhgScopeCode, string> = {
  SCOPE_1: 'Scope 1',
  SCOPE_2: 'Scope 2',
  SCOPE_3: 'Scope 3',
};

export function ScopeBadge({
  scope,
  className,
}: {
  scope: GhgScopeCode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        SCOPE_TONE[scope],
        className,
      )}
    >
      {SCOPE_LABEL_SHORT[scope]}
    </span>
  );
}
