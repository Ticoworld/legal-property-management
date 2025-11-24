import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function FormSkeleton() {
  return (
    <div className="h-[400px] rounded-lg border p-6 flex flex-col space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="mt-auto flex justify-end">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

export default FormSkeleton;
