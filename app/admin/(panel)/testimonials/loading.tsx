import { SkeletonListPage } from '@/components/admin/skeletons';

export default function Loading() {
  return <SkeletonListPage rows={5} cols={4} />;
}
