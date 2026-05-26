import { FilterSuspense } from '@/components/layout/FilterSuspense';
import { DashboardPage } from './dashboard-page';

export default function Page() {
  return (
    <FilterSuspense>
      <DashboardPage />
    </FilterSuspense>
  );
}
