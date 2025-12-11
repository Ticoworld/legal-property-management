"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helper";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { canManageTeam, canModifyUser, getAllowedRolesToCreate } from "@/lib/permissions";
import { UserRole } from "@prisma/client";

const CreateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
  role: z.enum(["SUPER_ADMIN", "MANAGER", "ASSOCIATE", "VIEWER"]),
});

function normalize(input: FormData | Record<string, unknown>): Record<string, unknown> {
  if (input instanceof FormData) {
    const o: Record<string, unknown> = {};
    input.forEach((value, key) => {
      o[key] = typeof value === "string" ? value : String(value);
    });
    return o;
  }
  return input;
}

export type ActionResult = {
  success: boolean;
  message: string;
  errors?: unknown;
};

export async function createUser(input: FormData | Record<string, unknown>): Promise<ActionResult> {
  try {
    const current = await getCurrentUser();
    if (!canManageTeam(current.role)) {
      throw new Error("Unauthorized: Only SUPER_ADMIN or MANAGER can manage team");
    }

    const parsed = CreateUserSchema.safeParse(normalize(input));
    if (!parsed.success) {
      return { success: false, message: "Validation failed", errors: parsed.error.flatten() };
    }

    const { name, email, password, role } = parsed.data;

    // 🔒 Role Hierarchy: MANAGER cannot create SUPER_ADMIN users
    const allowedRoles = getAllowedRolesToCreate(current.role);
    if (!allowedRoles.includes(role as UserRole)) {
      return { success: false, message: `Unauthorized: You cannot create users with role ${role}` };
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return { success: false, message: "Email already exists" };
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name, email, password: hashed, role, mustChangePassword: true },
        select: { id: true, email: true, role: true, name: true },
      });

      await tx.auditLog.create({
        data: {
          action: "CREATE_USER",
          entityType: "User",
          entityId: created.id,
          performedBy: current.id,
          details: { email: created.email, role: created.role },
        },
      });

      return created;
    });

    revalidatePath("/settings");
    return { success: true, message: "User created" };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed to create user" };
  }
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  try {
    const current = await getCurrentUser();
    if (!canManageTeam(current.role)) {
      throw new Error("Unauthorized: Only SUPER_ADMIN or MANAGER can manage team");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, message: "User not found" };
    }

    // 🔒 Role Hierarchy: MANAGER cannot delete SUPER_ADMIN users
    if (!canModifyUser(current.role, user.role)) {
      return { success: false, message: `Unauthorized: You cannot delete users with role ${user.role}` };
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.delete({ where: { id: userId } });
      await tx.auditLog.create({
        data: {
          action: "DELETE_USER",
          entityType: "User",
          entityId: userId,
          performedBy: current.id,
          details: { email: user.email, role: user.role },
        },
      });
    });

    revalidatePath("/settings");
    return { success: true, message: "User deleted" };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed to delete user" };
  }
}

// Convenience wrapper to use as a form action from Client Components
export async function deleteUserAction(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("userId") || "");
  return deleteUser(id);
}

/**
 * resetUserPassword
 * 
 * Allows ADMIN to reset a staff member's password.
 * Security: Cannot reset own password (prevents accidental lockout).
 * Audit: Logs PASSWORD_RESET_BY_ADMIN.
 */
export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<ActionResult> {
  try {
    const current = await getCurrentUser();
    
    // RBAC: Only SUPER_ADMIN and MANAGER can reset passwords
    if (!canManageTeam(current.role)) {
      return { success: false, message: "Unauthorized: Only SUPER_ADMIN or MANAGER can reset passwords" };
    }

    // Security: Prevent admin from resetting their own password via this flow
    if (current.id === userId) {
      return { success: false, message: "Cannot reset your own password. Use profile settings instead." };
    }

    // Validate password
    if (!newPassword || newPassword.length < 8) {
      return { success: false, message: "Password must be at least 8 characters" };
    }

    // Find the user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Update with audit log
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { password: hashed, mustChangePassword: true },
      });

      await tx.auditLog.create({
        data: {
          action: "PASSWORD_RESET_BY_ADMIN",
          entityType: "User",
          entityId: userId,
          performedBy: current.id,
          details: { 
            targetEmail: user.email, 
            targetRole: user.role,
            resetBy: current.email,
          },
        },
      });
    });

    revalidatePath("/settings");
    return { success: true, message: "Password has been reset successfully" };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed to reset password" };
  }
}
