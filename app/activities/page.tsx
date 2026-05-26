import { FilterSuspense } from '@/components/layout/FilterSuspense';
import { ActivitiesPage } from './activities-page';

export default function Page() {
  return (
    <FilterSuspense>
      <ActivitiesPage />
    </FilterSuspense>
  );
}
