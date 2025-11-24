"use client";
import * as React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorCardProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorCard({ message = 'Something went wrong.', onRetry }: ErrorCardProps) {
  const handleRetry = () => {
    // First try Next.js reset, then fallback to page reload if still fails
    onRetry();
    // Give reset a moment, then reload if error persists
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }, 100);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border bg-background shadow-sm p-6 space-y-4 text-center">
        <h2 className="text-xl font-semibold">{message}</h2>
        <p className="text-sm text-muted-foreground">
          {message === 'No Internet Connection'
            ? 'Please check your network and try again.'
            : 'An unexpected error occurred. You may retry the action.'}
        </p>
        <Button onClick={handleRetry} variant="default" className="mt-2">
          Try Again
        </Button>
      </div>
    </div>
  );
}

export default ErrorCard;
