import { Skeleton } from '@/components/ui/skeleton';

function FieldSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      <Skeleton className="h-[11px] w-16" />
      <Skeleton className="h-[42px] w-full rounded-[9px]" />
    </div>
  );
}

export function AuthFormSkeleton({ variant }: { variant: 'sign-in' | 'sign-up' }) {
  return (
    <div className="space-y-3">
      {/* Title + subtitle */}
      <Skeleton className="h-6 w-48" />
      <Skeleton className="mb-4 h-3.5 w-64" />

      {/* Security badge placeholder */}
      <Skeleton className="mb-3 h-8 w-full rounded-lg" />

      {/* Fields */}
      {variant === 'sign-up' && <FieldSkeleton />}
      <FieldSkeleton />
      <FieldSkeleton />

      {/* Remember / checkbox row */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-32" />
        {variant === 'sign-in' && <Skeleton className="h-3.5 w-12" />}
      </div>

      {/* Submit button */}
      <Skeleton className="h-[46px] w-full rounded-[10px]" />

      {/* Divider */}
      <Skeleton className="mx-auto h-3 w-28" />

      {/* OAuth buttons */}
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-10 rounded-[9px]" />
        <Skeleton className="h-10 rounded-[9px]" />
        <Skeleton className="h-10 rounded-[9px]" />
      </div>

      {/* Footer link */}
      <Skeleton className="mx-auto h-3 w-40" />
    </div>
  );
}
