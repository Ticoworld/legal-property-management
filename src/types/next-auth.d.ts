import { DefaultSession } from "next-auth";

// Inline to avoid @prisma/client import in Edge-resolved type context
type UserRole = 'SUPER_ADMIN' | 'MANAGER' | 'ASSOCIATE' | 'VIEWER';

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      mustChangePassword: boolean;
    } & DefaultSession['user'];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    mustChangePassword?: boolean;
  }
}
