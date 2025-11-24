"use client";
import ErrorCard from '@/components/error-card';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const digest = error?.digest || '';
  const isOffline = /fetch failed/i.test(digest) || /fetch failed/i.test(error.message);
  const message = isOffline ? 'No Internet Connection' : 'Something went wrong.';
  return <ErrorCard message={message} onRetry={reset} />;
}
