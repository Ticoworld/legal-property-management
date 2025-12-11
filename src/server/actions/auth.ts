"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

/**
 * Recover account using Recovery Key
 * Validates email and recovery key, then resets password
 */
export async function recoverAccount(
  email: string,
  key: string,
  newPassword: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Basic validation
    if (!email || !key || !newPassword) {
      return {
        success: false,
        error: "All fields are required.",
      };
    }

    // Find the user
    // We only allow recovery for users who have a recovery key set (likely Super Admin)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // Return generic error to avoid enumeration (though email enumeration might be possible elsewhere)
      return {
        success: false,
        error: "Invalid email or recovery key.",
      };
    }

    // Check if user has a recovery key
    if (!user.recoveryKey) {
      return {
        success: false,
        error: "Account recovery is not enabled for this user.",
      };
    }

    // Verify the Recovery Key
    const isValidKey = await bcrypt.compare(key.trim(), user.recoveryKey);

    if (!isValidKey) {
      // Log failed attempt
      await prisma.auditLog.create({
        data: {
          action: "RECOVERY_FAILED_INVALID_KEY",
          entityType: "User",
          entityId: user.id,
          performedBy: user.id, // self-action attempt
          details: {
            email: email,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return {
        success: false,
        error: "Invalid email or recovery key.",
      };
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the password and require change on next login? 
    // Requirement says "Reset Password (New Password)". 
    // Usually via recovery you set a new strong password and you're good.
    // We should also invalidate sessions? NextAuth handles sessions via db or jwt.
    // If db sessions, ideally we clear them.
    
    await prisma.$transaction(async (tx) => {
      // Update password
      await tx.user.update({
        where: { id: user.id },
        data: { 
          password: hashedPassword,
          mustChangePassword: false 
        },
      });

      // Invalidate existing sessions
      await tx.session.deleteMany({
        where: { userId: user.id },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          action: "ACCOUNT_RECOVERED_WITH_KEY",
          entityType: "User",
          entityId: user.id,
          performedBy: user.id,
          details: {
            email: email,
            timestamp: new Date().toISOString(),
          },
        },
      });
    });

    return { success: true };

  } catch (error) {
    console.error("Error recovering account:", error);
    return {
      success: false,
      error: "An unexpected error occurred during recovery.",
    };
  }
}

import { getCurrentUser } from "@/lib/auth-helper";

/**
 * Update current user's password
 * Used for "Must Change Password" flow or voluntary updates.
 */
export async function updateMyPassword(newPassword: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    
    if (!newPassword || newPassword.length < 8) {
        return { success: false, error: "Password must be at least 8 characters long." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          mustChangePassword: false,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "PASSWORD_CHANGED_BY_USER",
          entityType: "User",
          entityId: user.id,
          performedBy: user.id,
          details: {
            email: user.email,
            timestamp: new Date().toISOString(),
          },
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating password:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update password",
    };
  }
}
