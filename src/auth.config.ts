import type { NextAuthConfig } from "next-auth";

// Inline role type to keep this file Edge-safe (no @prisma/client import)
type UserRole = 'SUPER_ADMIN' | 'MANAGER' | 'ASSOCIATE' | 'VIEWER';

// Valid roles for type guard
const validRoles: UserRole[] = ['SUPER_ADMIN', 'MANAGER', 'ASSOCIATE', 'VIEWER'];

// Base auth configuration: only route authorization logic here.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    // Runs in middleware context to allow/deny access
    async authorized({ auth, request }) {
      const { nextUrl } = request;
      // Allow public login page
      if (nextUrl.pathname === "/login") return true;
      // Deny access if no authenticated user
      return !!auth?.user;
    },
    async jwt({ token, user }) {
      const isRole = (r: unknown): r is UserRole =>
        validRoles.includes(r as UserRole);
      if (user && 'role' in user && isRole((user as { role?: UserRole }).role)) {
        token.role = (user as { role?: UserRole }).role;
      }
      return token;
    },
    async session({ session, token }) {
      const isRole = (r: unknown): r is UserRole =>
        validRoles.includes(r as UserRole);
      if (token?.sub) {
        session.user.id = token.sub;
      }
      if (isRole(token.role)) {
        session.user.role = token.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

