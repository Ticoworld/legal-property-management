import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-950">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900">
            <svg
              className="h-8 w-8 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-white">Page Not Found</CardTitle>
          <CardDescription className="text-zinc-400">
            The page you&apos;re looking for doesn&apos;t exist
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-center">
            <p className="text-6xl font-bold text-zinc-700">404</p>
          </div>
          <p className="text-center text-sm text-zinc-500">
            The page may have been moved or deleted. Please check the URL or return to the dashboard.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="default" className="w-full">
              <Link href="/">Go to Dashboard</Link>
            </Button>
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="w-full border-zinc-800 hover:bg-zinc-900"
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
