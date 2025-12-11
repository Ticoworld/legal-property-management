"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schema for firm settings update
const FirmSettingsSchema = z.object({
  firmName: z.string().min(1, "Firm name is required"),
  chambersName: z.string().min(1, "Chambers name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  solicitorName: z.string().min(1, "Solicitor name is required"),
  solicitorTitle: z.string().min(1, "Solicitor title is required"),
});

export type FirmSettingsInput = z.infer<typeof FirmSettingsSchema>;

// Type for FirmSettings from database
export type FirmSettings = {
  id: string;
  firmName: string;
  chambersName: string;
  address: string;
  city: string;
  state: string;
  solicitorName: string;
  solicitorTitle: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Gets firm settings (creates default if missing)
 * Cached for performance
 */
export async function getFirmSettings(): Promise<FirmSettings> {
  let settings = await prisma.firmSettings.findFirst();

  // If no settings exist, create default ones
  if (!settings) {
    settings = await prisma.firmSettings.create({
      data: {
        firmName: "Ogodo, Ogodo & Co.",
        chambersName: "Beracah Chambers",
        address: "14 Ojeawere Street, Abakaliki, Ebonyi State",
        city: "Abakaliki",
        state: "Ebonyi",
        solicitorName: "K. O. Ogboso, Esq.",
        solicitorTitle: "Legal Practitioner",
      },
    });
  }

  return settings;
}

/**
 * Updates firm settings (SUPER_ADMIN only)
 */
export async function updateFirmSettings(
  data: FirmSettingsInput
): Promise<{ success: boolean; message?: string }> {
  const session = await auth();

  // RBAC check - only SUPER_ADMIN can update firm settings
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return {
      success: false,
      message: "Only Super Admin can update firm settings",
    };
  }

  // Validate input
  const parsed = FirmSettingsSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  try {
    // Get existing settings or create new
    const existing = await prisma.firmSettings.findFirst();

    if (existing) {
      await prisma.firmSettings.update({
        where: { id: existing.id },
        data: parsed.data,
      });
    } else {
      await prisma.firmSettings.create({
        data: parsed.data,
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "UPDATED_FIRM_SETTINGS",
        entityType: "FirmSettings",
        entityId: existing?.id || "new",
        performedBy: session.user.id!,
        details: parsed.data,
      },
    });

    revalidatePath("/settings");

    return { success: true };
  } catch (error) {
    console.error("Failed to update firm settings:", error);
    return {
      success: false,
      message: "Failed to update firm settings",
    };
  }
}
