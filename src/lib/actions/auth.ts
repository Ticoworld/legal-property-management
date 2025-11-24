"use server";

import { z } from "zod";
import { signIn, signOut } from "@/auth";

const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 chars"),
});

export type AuthState = {
  success: boolean;
  error?: string;
};

export async function authenticate(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const raw = Object.fromEntries(formData.entries());
  console.log('\n========== [AUTHENTICATE] START ==========');
  console.log('[AUTHENTICATE] Raw form data:', { 
    email: raw.email, 
    passwordLength: (raw.password as string)?.length,
    passwordFirstChar: (raw.password as string)?.[0],
    passwordLastChar: (raw.password as string)?.[(raw.password as string).length - 1]
  });
  
  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('[AUTHENTICATE] ❌ Validation failed:', parsed.error.issues);
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  console.log('[AUTHENTICATE] ✓ Validation passed');
  console.log('[AUTHENTICATE] Parsed data:', { email: parsed.data.email, passwordLength: parsed.data.password.length });

  try {
    console.log('[AUTHENTICATE] Calling signIn with credentials provider...');
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/",
    });
    console.log('[AUTHENTICATE] ✓ signIn succeeded');
    return { success: true };
  } catch (e) {
    // Next.js throws NEXT_REDIRECT on successful redirect - this is expected behavior
    if (e && typeof e === 'object' && 'message' in e && (e as Error).message === 'NEXT_REDIRECT') {
      console.log('[AUTHENTICATE] ✓ Redirect triggered (authentication successful)');
      console.log('========== [AUTHENTICATE] END ==========\n');
      throw e; // Re-throw to allow Next.js to handle the redirect
    }
    
    console.error('[AUTHENTICATE] ✗ signIn failed');
    console.error('[AUTHENTICATE] Error:', e);
    console.error('[AUTHENTICATE] Error message:', (e as Error)?.message);
    console.log('========== [AUTHENTICATE] END ==========\n');
    return { success: false, error: "Invalid credentials" };
  }
}

/**
 * Server action to log out the current user
 * Redirects to /login after signing out
 */
export async function logout() {
  console.log('\n========== [LOGOUT] START ==========');
  console.log('[LOGOUT] Signing out user...');
  
  try {
    await signOut({ redirectTo: "/login" });
    console.log('[LOGOUT] ✓ Sign out successful');
  } catch (e) {
    // Next.js throws NEXT_REDIRECT on successful redirect - this is expected behavior
    if (e && typeof e === 'object' && 'message' in e && (e as Error).message === 'NEXT_REDIRECT') {
      console.log('[LOGOUT] ✓ Redirect triggered (logout successful)');
      console.log('========== [LOGOUT] END ==========\n');
      throw e; // Re-throw to allow Next.js to handle the redirect
    }
    
    console.error('[LOGOUT] ✗ Sign out failed');
    console.error('[LOGOUT] Error:', e);
    console.log('========== [LOGOUT] END ==========\n');
    throw e;
  }
}

