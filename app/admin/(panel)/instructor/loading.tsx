import { SkeletonForm, SkeletonRoot, SkeletonText } from '@/components/admin/skeletons';

export default function Loading() {
  return (
    <SkeletonRoot className="space-y-4">
      <div className="space-y-2">
        <SkeletonText className="h-7 w-48" />
        <SkeletonText className="h-4 w-64" />
      </div>
      <div className="flex gap-2">
        <SkeletonText className="h-10 w-28 rounded-xl" />
        <SkeletonText className="h-10 w-24 rounded-xl" />
      </div>
      <SkeletonForm fields={8} />
    </SkeletonRoot>
  );
}