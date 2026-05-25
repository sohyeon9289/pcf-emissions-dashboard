'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import type { ActivityFilterInput } from '@/lib/validation';

/**
 * URL search params 와 동기화되는 필터 상태 훅.
 *
 * Why URL: 공유 가능한 대시보드 링크 + 새로고침 시 상태 유지.
 * 별도 Zustand store 대신 search params 만으로 충분하다 (싱글 소스).
 */
const KEYS = ['companyId', 'typeKey', 'scope', 'from', 'to'] as const;
type Key = (typeof KEYS)[number];

export function useFilterUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const filter: ActivityFilterInput = useMemo(() => {
    const out: ActivityFilterInput = {};
    for (const k of KEYS) {
      const v = params.get(k);
      if (v) (out as Record<string, string>)[k] = v;
    }
    return out;
  }, [params]);

  const setFilter = useCallback(
    (patch: Partial<ActivityFilterInput>) => {
      const next = new URLSearchParams(params.toString());
      for (const k of KEYS) {
        const v = (patch as Record<string, string | undefined>)[k];
        if (v === undefined) continue;
        if (!v) next.delete(k);
        else next.set(k, v);
      }
      const q = next.toString();
      router.replace(`${pathname}${q ? `?${q}` : ''}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const reset = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const activeCount = Object.values(filter).filter(Boolean).length;

  return { filter, setFilter, reset, activeCount };
}

export type Key2 = Key;
