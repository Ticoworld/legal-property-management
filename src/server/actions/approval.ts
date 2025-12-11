"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helper";
import { VerificationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { canApproveRecords } from "@/lib/permissions";

export type ActionResult = {
  success: boolean;
  message: string;
};

export async function approveRecord(
  id: string, 
  model: 'Client' | 'Property' | 'Tenancy'
): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();

    if (!canApproveRecords(currentUser.role)) {
      return { success: false, message: 'Unauthorized: Only SUPER_ADMIN or MANAGER can approve records' };
    }

    await prisma.$transaction(async (tx) => {
      // Dynamic update based on model
      if (model === 'Client') {
        await tx.client.update({
          where: { id },
          data: { verificationStatus: VerificationStatus.APPROVED },
        });
      } else if (model === 'Property') {
        await tx.property.update({
          where: { id },
          data: { verificationStatus: VerificationStatus.APPROVED },
        });
      } else if (model === 'Tenancy') {
        await tx.tenancy.update({
          where: { id },
          data: { verificationStatus: VerificationStatus.APPROVED },
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'RECORD_APPROVED',
          entityType: model,
          entityId: id,
          performedBy: currentUser.id,
          details: {
            reason: 'Admin approval granted',
          },
        },
      });
    });

    // Revalidate paths
    revalidatePath('/clients');
    revalidatePath('/properties');
    revalidatePath('/tenancies');
    revalidatePath('/dashboard');

    return { success: true, message: 'Record approved successfully' };
  } catch (error) {
    console.error('approveRecord error:', error);
    return { success: false, message: 'Failed to approve record' };
  }
}

/**
 * rejectRecord
 * 
 * Marks a Client, Property, or Tenancy as REJECTED.
 * For Clients: Does NOT delete - just marks as REJECTED to preserve data integrity.
 * Properties owned by the client are preserved.
 */
export async function rejectRecord(
  id: string,
  model: 'Client' | 'Property' | 'Tenancy'
): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();

    if (!canApproveRecords(currentUser.role)) {
      return { success: false, message: 'Unauthorized: Only SUPER_ADMIN or MANAGER can reject records' };
    }

    await prisma.$transaction(async (tx) => {
      if (model === 'Client') {
        // Check if client has properties - warn but proceed
        const client = await tx.client.findUnique({
          where: { id },
          include: { _count: { select: { properties: true } } },
        });

        if (!client) {
          throw new Error('Client not found');
        }

        // Mark as REJECTED (do not delete)
        await tx.client.update({
          where: { id },
          data: { verificationStatus: VerificationStatus.REJECTED },
        });

        await tx.auditLog.create({
          data: {
            action: 'CLIENT_REJECTED',
            entityType: 'Client',
            entityId: id,
            performedBy: currentUser.id,
            details: {
              reason: 'Admin rejection - client marked as rejected',
              propertyCount: client._count.properties,
            },
          },
        });
      } else if (model === 'Property') {
        await tx.property.update({
          where: { id },
          data: { verificationStatus: VerificationStatus.REJECTED },
        });

        await tx.auditLog.create({
          data: {
            action: 'PROPERTY_REJECTED',
            entityType: 'Property',
            entityId: id,
            performedBy: currentUser.id,
            details: {
              reason: 'Admin rejection',
            },
          },
        });
      } else if (model === 'Tenancy') {
        await tx.tenancy.update({
          where: { id },
          data: { verificationStatus: VerificationStatus.REJECTED },
        });

        await tx.auditLog.create({
          data: {
            action: 'TENANCY_REJECTED',
            entityType: 'Tenancy',
            entityId: id,
            performedBy: currentUser.id,
            details: {
              reason: 'Admin rejection',
            },
          },
        });
      }
    });

    // Revalidate paths
    revalidatePath('/clients');
    revalidatePath('/properties');
    revalidatePath('/tenancies');
    revalidatePath('/dashboard');

    return { success: true, message: 'Record rejected successfully' };
  } catch (error) {
    console.error('rejectRecord error:', error);
    return { success: false, message: 'Failed to reject record' };
  }
}
