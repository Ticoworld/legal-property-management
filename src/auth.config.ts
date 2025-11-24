import type { NextAuthConfig } from "next-auth";

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
      const isRole = (r: unknown): r is 'ADMIN' | 'ASSOCIATE' | 'VIEWER' =>
        r === 'ADMIN' || r === 'ASSOCIATE' || r === 'VIEWER';
      if (user && 'role' in user && isRole((user as { role?: 'ADMIN'|'ASSOCIATE'|'VIEWER' }).role)) {
        token.role = (user as { role?: 'ADMIN'|'ASSOCIATE'|'VIEWER' }).role;
      }
      return token;
    },
    async session({ session, token }) {
      const isRole = (r: unknown): r is 'ADMIN' | 'ASSOCIATE' | 'VIEWER' =>
        r === 'ADMIN' || r === 'ASSOCIATE' || r === 'VIEWER';
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
