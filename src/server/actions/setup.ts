"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import crypto from "crypto";

/**
 * Check if the system has been initialized
 * Returns true if at least one user exists in the database
 */
export async function checkSystemStatus(): Promise<{ isInitialized: boolean }> {
  try {
    const userCount = await prisma.user.count();
    return { isInitialized: userCount > 0 };
  } catch (error) {
    console.error("Error checking system status:", error);
    return { isInitialized: false };
  }
}

interface InitializeSystemData {
  // Administrator Details
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  
  // Firm Identity
  firmName: string;
  chambersName: string;
  address: string;
  city: string;
  state: string;
  solicitorName: string;
  solicitorTitle: string;
}

/**
 * Initialize the system - The "Big Bang" creation
 * Creates the Super Admin and Firm Settings
 * Generates and returns the Recovery Key
 * This can only be run once when the system is empty
 */
export async function initializeSystem(data: InitializeSystemData): Promise<{
  success: boolean;
  error?: string;
  recoveryKey?: string;
}> {
  try {
    // Double-check that system is not already initialized
    const { isInitialized } = await checkSystemStatus();
    if (isInitialized) {
      return {
        success: false,
        error: "System is already initialized. Cannot run setup again.",
      };
    }

    // Validate required fields
    if (
      !data.adminName ||
      !data.adminEmail ||
      !data.adminPassword
    ) {
      return {
        success: false,
        error: "All administrator fields are required.",
      };
    }

    // Generate Recovery Key (REC-XXXX-XXXX-XXXX)
    // 12 random bytes = 24 hex characters, we can take substrings or just use randomBytes
    // Let's make it readable: REC-4chars-4chars-4chars (12 chars of randomness)
    const randomBytes = crypto.randomBytes(6).toString('hex').toUpperCase(); // 12 chars
    const recoveryKey = `REC-${randomBytes.slice(0, 4)}-${randomBytes.slice(4, 8)}-${randomBytes.slice(8, 12)}`;

    // Hash the password and recovery key
    const hashedPassword = await bcrypt.hash(data.adminPassword, 12);
    const hashedRecoveryKey = await bcrypt.hash(recoveryKey, 12);

    // Create everything in a transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Create the Super Admin
      const superAdmin = await tx.user.create({
        data: {
          name: data.adminName,
          email: data.adminEmail.toLowerCase().trim(),
          password: hashedPassword,
          role: UserRole.SUPER_ADMIN,
          emailVerified: new Date(), // Auto-verify the super admin
          recoveryKey: hashedRecoveryKey,
          mustChangePassword: false,
        },
      });

      // 2. Create the Firm Settings
      await tx.firmSettings.create({
        data: {
          firmName: data.firmName || "Ogodo, Ogodo & Co.",
          chambersName: data.chambersName || "Beracah Chambers",
          address: data.address || "14 Ojeawere Street, Abakaliki, Ebonyi State",
          city: data.city || "Abakaliki",
          state: data.state || "Ebonyi",
          solicitorName: data.solicitorName || "K. O. Ogboso, Esq.",
          solicitorTitle: data.solicitorTitle || "Legal Practitioner",
        },
      });

      // 3. Create audit log for system initialization
      await tx.auditLog.create({
        data: {
          action: "SYSTEM_INITIALIZED",
          entityType: "System",
          entityId: "SYSTEM",
          performedBy: superAdmin.id,
          details: {
            adminEmail: data.adminEmail,
            firmName: data.firmName,
            timestamp: new Date().toISOString(),
          },
        },
      });
    });

    return { 
      success: true,
      recoveryKey: recoveryKey 
    };
  } catch (error) {
    console.error("Error initializing system:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initialize system",
    };
  }
}
