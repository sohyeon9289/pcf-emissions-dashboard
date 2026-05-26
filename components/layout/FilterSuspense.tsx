import { Suspense, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

/** useSearchParams(useFilterUrl) 사용 페이지를 Suspense로 감싸 prerender 오류 방지 */
export function FilterSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
