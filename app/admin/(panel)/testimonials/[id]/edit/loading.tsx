import { SkeletonForm, SkeletonRoot } from '@/components/admin/skeletons';

export default function Loading() {
  return (
    <SkeletonRoot>
      <SkeletonForm fields={6} />
    </SkeletonRoot>
  );
}
