"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helper";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { MaintenanceStatus, MaintenancePriority } from "@prisma/client";
import { canCreateRecords } from "@/lib/permissions";

// ============================================
// Schemas
// ============================================

const CreateMaintenanceRequestSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  propertyId: z.string().min(1, "Property is required"),
  unitId: z.string().optional().nullable(),
  tenancyId: z.string().optional().nullable(),
});

const UpdateStatusSchema = z.object({
  id: z.string().min(1, "Request ID is required"),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
});

// ============================================
// Types
// ============================================

export type ActionResult = {
  success: boolean;
  message: string;
  data?: unknown;
  errors?: unknown;
};

// ============================================
// Actions
// ============================================

/**
 * createMaintenanceRequest
 * 
 * Creates a new maintenance request/ticket.
 * Logs MAINTENANCE_REQUESTED to audit log.
 */
export async function createMaintenanceRequest(
  input: z.infer<typeof CreateMaintenanceRequestSchema>
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    
    // RBAC: SUPER_ADMIN, MANAGER, and ASSOCIATE can create tickets
    if (!canCreateRecords(user.role)) {
      return { success: false, message: "Unauthorized: Insufficient permissions" };
    }

    const parsed = CreateMaintenanceRequestSchema.safeParse(input);
    if (!parsed.success) {
      return { 
        success: false, 
        message: "Validation failed", 
        errors: parsed.error.flatten() 
      };
    }

    const { title, description, priority, propertyId, unitId, tenancyId } = parsed.data;

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, address: true },
    });

    if (!property) {
      return { success: false, message: "Property not found" };
    }

    // Create the maintenance request with audit log
    const request = await prisma.$transaction(async (tx) => {
      const created = await tx.maintenanceRequest.create({
        data: {
          title,
          description,
          priority: priority as MaintenancePriority,
          status: "OPEN",
          propertyId,
          unitId: unitId || null,
          tenancyId: tenancyId || null,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          action: "MAINTENANCE_REQUESTED",
          entityType: "MaintenanceRequest",
          entityId: created.id,
          performedBy: user.id,
          details: {
            title,
            priority,
            propertyAddress: property.address,
            tenancyId: tenancyId || null,
          },
        },
      });

      return created;
    });

    // Revalidate relevant paths
    revalidatePath(`/properties/${propertyId}`);
    if (tenancyId) {
      revalidatePath(`/tenancies/${tenancyId}`);
    }

    return { 
      success: true, 
      message: "Maintenance request created successfully",
      data: { id: request.id }
    };
  } catch (error) {
    console.error("Create maintenance request error:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to create maintenance request" 
    };
  }
}

/**
 * updateMaintenanceStatus
 * 
 * Updates the status of a maintenance request.
 * Logs MAINTENANCE_STATUS_UPDATED with old->new status.
 */
export async function updateMaintenanceStatus(
  id: string,
  newStatus: MaintenanceStatus
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    
    // RBAC: SUPER_ADMIN, MANAGER, and ASSOCIATE can update status
    if (!canCreateRecords(user.role)) {
      return { success: false, message: "Unauthorized: Insufficient permissions" };
    }

    const parsed = UpdateStatusSchema.safeParse({ id, status: newStatus });
    if (!parsed.success) {
      return { 
        success: false, 
        message: "Validation failed", 
        errors: parsed.error.flatten() 
      };
    }

    // Get current request
    const existing = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, address: true } },
      },
    });

    if (!existing) {
      return { success: false, message: "Maintenance request not found" };
    }

    const oldStatus = existing.status;

    // Update with audit log
    await prisma.$transaction(async (tx) => {
      await tx.maintenanceRequest.update({
        where: { id },
        data: { status: newStatus },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          action: "MAINTENANCE_STATUS_UPDATED",
          entityType: "MaintenanceRequest",
          entityId: id,
          performedBy: user.id,
          details: {
            title: existing.title,
            oldStatus,
            newStatus,
            propertyAddress: existing.property.address,
          },
        },
      });
    });

    // Revalidate paths
    revalidatePath(`/properties/${existing.propertyId}`);
    if (existing.tenancyId) {
      revalidatePath(`/tenancies/${existing.tenancyId}`);
    }

    return { 
      success: true, 
      message: `Status updated: ${oldStatus} → ${newStatus}` 
    };
  } catch (error) {
    console.error("Update maintenance status error:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to update status" 
    };
  }
}
