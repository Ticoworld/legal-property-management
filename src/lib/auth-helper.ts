import 'server-only';
import { auth } from '@/auth';

export type AuthUser = {
  id: string;
  role: 'ADMIN' | 'ASSOCIATE' | 'VIEWER';
  email: string;
  name?: string | null;
};

// Returns the currently authenticated user via NextAuth session.
// Throws if unauthenticated to enforce explicit handling in callers.
export async function getCurrentUser(): Promise<AuthUser> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthenticated');
  }
  
  // ✅ Type-safe extraction without 'as any'
  const user = session.user;
  
  if (!user.id || !user.email || !user.role) {
    throw new Error('Invalid session: missing required user fields');
  }
  
  // Type guard to ensure role is valid
  const role = user.role as 'ADMIN' | 'ASSOCIATE' | 'VIEWER';
  if (role !== 'ADMIN' && role !== 'ASSOCIATE' && role !== 'VIEWER') {
    throw new Error('Invalid user role in session');
  }
  
  return { 
    id: user.id, 
    email: user.email, 
    role, 
    name: user.name 
  };
}
