import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function TableSkeleton() {
  // Render table header + 5 body rows with skeleton cells
  return (
    <div className="w-full overflow-hidden rounded-md border">
      <table className="w-full border-collapse">
        <thead className="bg-muted/40">
          <tr className="h-10">
            {Array.from({ length: 5 }).map((_, i) => (
              <th key={i} className="px-4 text-left">
                <Skeleton className="h-4 w-24" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, r) => (
            <tr key={r} className="h-12 border-t">
              {Array.from({ length: 5 }).map((_, c) => (
                <td key={c} className="px-4">
                  <Skeleton className="h-4 w-[70%]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TableSkeleton;
