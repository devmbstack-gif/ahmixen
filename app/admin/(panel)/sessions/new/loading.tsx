import { SkeletonForm } from '@/components/admin/skeletons';
import { SkeletonRoot } from '@/components/admin/skeletons';

export default function Loading() {
  return (
    <SkeletonRoot>
      <SkeletonForm fields={10} />
    </SkeletonRoot>
  );
}
