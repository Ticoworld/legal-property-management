import * as React from 'react';
import { cn } from '@/lib/utils';

// Base Skeleton component (Stripe-Clean aesthetic)
// Subtle gray pulse using tailwind's animate-pulse and bg-muted token.
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}
