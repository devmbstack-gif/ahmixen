import { SkeletonListPage } from '@/components/admin/skeletons';

export default function Loading() {
  return <SkeletonListPage showCards rows={4} cols={4} />;
}
