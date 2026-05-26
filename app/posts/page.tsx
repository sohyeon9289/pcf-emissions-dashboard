import { FilterSuspense } from '@/components/layout/FilterSuspense';
import { PostsPage } from './posts-page';

export default function Page() {
  return (
    <FilterSuspense>
      <PostsPage />
    </FilterSuspense>
  );
}
