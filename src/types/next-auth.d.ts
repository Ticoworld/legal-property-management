import { DefaultSession } from "next-auth";
import { UserRole } from "@prisma/client";

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
