'use client';

import * as React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/cn';

type ToastTone = 'success' | 'error' | 'info';
type ToastItem = {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void } | null;
};

type ToastContextValue = {
  push: (t: Omit<ToastItem, 'id'>) => string;
  dismiss: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = React.useCallback(
    (t: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).slice(2);
      setItems((prev) => [...prev, { ...t, id }]);
      const ms = t.tone === 'error' ? 6000 : 3500;
      setTimeout(() => dismiss(id), ms);
      return id;
    },
    [dismiss],
  );

  const ctx = React.useMemo<ToastContextValue>(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border p-3 shadow-lg backdrop-blur',
              t.tone === 'success' && 'border-success/40 bg-success/10 text-foreground',
              t.tone === 'error' && 'border-destructive/40 bg-destructive/10 text-foreground',
              t.tone === 'info' && 'border-border bg-card text-foreground',
            )}
          >
            <div className="mt-0.5">
              {t.tone === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : t.tone === 'error' ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : (
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium">{t.title}</p>
              {t.description ? (
                <p className="text-xs text-muted-foreground">{t.description}</p>
              ) : null}
              {t.action ? (
                <button
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                  className="mt-2 text-xs font-semibold text-primary hover:underline"
                >
                  {t.action.label}
                </button>
              ) : null}
            </div>
            <button
              aria-label="닫기"
              onClick={() => dismiss(t.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
