import 'server-only';
import { auth } from '@/auth';
import { UserRole } from '@prisma/client';
import { redirect } from 'next/navigation';

export type AuthUser = {
  id: string;
  role: UserRole;
  email: string;
  name?: string | null;
};

// Returns the currently authenticated user via NextAuth session.
// Redirects to login if unauthenticated or session is invalid.
export async function getCurrentUser(): Promise<AuthUser> {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }
  
  // ✅ Type-safe extraction without 'as any'
  const user = session.user;
  
  // If session exists but missing critical fields (e.g. stale cookie with old role), force re-login
  if (!user.id || !user.email || !user.role) {
    redirect('/login');
  }
  
  // Type guard to ensure role is valid UserRole
  const validRoles: UserRole[] = ['SUPER_ADMIN', 'MANAGER', 'ASSOCIATE', 'VIEWER'];
  if (!validRoles.includes(user.role as UserRole)) {
    redirect('/login');
  }
  
  return { 
    id: user.id, 
    email: user.email, 
    role: user.role as UserRole, 
    name: user.name 
  };
}
