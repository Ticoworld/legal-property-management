"use client";

import { useActionState } from "react";
import { authenticate, type AuthState } from "@/lib/actions/auth";
import { useEffect } from "react";

const initialState: AuthState = { success: false };

export default function LoginPage() {
  const [state, formAction] = useActionState(authenticate, initialState);

  useEffect(() => {
    console.log('[LOGIN PAGE] State changed:', state);
    // Clear error after a delay for UX polish (optional)
    let t: NodeJS.Timeout | undefined;
    if (state.error) {
      t = setTimeout(() => {}, 4000);
    }
    return () => { if (t) clearTimeout(t); };
  }, [state.error, state]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 space-y-6">
            <div className="space-y-1 text-center">
              <h1 className="text-xl font-semibold tracking-tight">Legal PM</h1>
              <p className="text-sm text-muted-foreground">Secure Sign In</p>
            </div>
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              {state.error && (
                <div className="rounded-md border border-destructive bg-destructive/10 p-2 text-xs text-destructive">
                  {state.error}
                </div>
              )}
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                Sign In
              </button>
            </form>
            <p className="text-[10px] text-muted-foreground text-center">Authorized personnel only. Activity is logged.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
