import { SkeletonListPage } from '@/components/admin/skeletons';

export default function Loading() {
  return <SkeletonListPage showTabs rows={6} cols={6} />;
}
