"use server";

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helper';
import { PropertySchema, type PropertyInput } from '@/types/schema';

import type { Client } from '@prisma/client';
import { VerificationStatus } from '@prisma/client';

import type { ActionResult } from '@/server/actions/client';
import { canCreateRecords, canApproveRecords } from '@/lib/permissions';

/**
 * Generate smart unit names based on type and quantity
 * Examples: "Flat 1", "Flat 2", "Shop A", "Shop B", "Office 101"
 */
function generateUnitName(type: string, index: number, total: number): string {
  const baseNames: Record<string, string> = {
    ROOM_PARLOUR: 'Room & Parlour',
    SELF_CONTAIN: 'Self Contain',
    ONE_BEDROOM: 'Flat',
    TWO_BEDROOM: 'Flat',
    THREE_BEDROOM: 'Flat',
    FOUR_BEDROOM: 'Flat',
    DUPLEX: 'Duplex',
    SHOP: 'Shop',
    WAREHOUSE: 'Warehouse',
    PLOT_OF_LAND: 'Plot',
    OFFICE: 'Office',
  };

  const baseName = baseNames[type] || 'Unit';
  
  // For shops, use letters (A, B, C...)
  if (type === 'SHOP' && total <= 26) {
    const letter = String.fromCharCode(65 + index); // A=65 in ASCII
    return `${baseName} ${letter}`;
  }
  
  // For others, use numbers
  return `${baseName} ${index + 1}`;
}

/**
 * Get default bedroom/bathroom count based on unit type
 */
function getDefaultRoomCounts(type: string): { bedrooms?: number; bathrooms?: number } {
  switch (type) {
    case 'ROOM_PARLOUR':
      return { bedrooms: 1, bathrooms: 1 };
    case 'SELF_CONTAIN':
      return { bedrooms: 0, bathrooms: 1 };
    case 'ONE_BEDROOM':
      return { bedrooms: 1, bathrooms: 1 };
    case 'TWO_BEDROOM':
      return { bedrooms: 2, bathrooms: 2 };
    case 'THREE_BEDROOM':
      return { bedrooms: 3, bathrooms: 2 };
    case 'FOUR_BEDROOM':
      return { bedrooms: 4, bathrooms: 3 };
    case 'DUPLEX':
      return { bedrooms: 4, bathrooms: 3 };
    default:
      return {};
  }
}

function normalizePropertyInput(input: FormData | Record<string, unknown>): Record<string, unknown> {
  if (input instanceof FormData) {
    const obj: Record<string, unknown> = {};
    input.forEach((value, key) => {
      obj[key] = typeof value === 'string' ? value : value.toString();
    });
    return obj;
  }

  return input;
}

/**
 * createProperty
 *
 * - Validates input with Zod (PropertySchema)
 * - Verifies that ownerId refers to an existing Client
 * - Handles bulk unit creation for multi-unit properties
 * - Uses a transaction to create Property + Units + Documents + AuditLog atomically
 */
export async function createProperty(
  input: FormData | Partial<PropertyInput>,
  documents?: Array<{ url: string; name: string; type: string }>
): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();

    // 🔒 RBAC: Only SUPER_ADMIN, MANAGER, and ASSOCIATE can create properties
    if (!canCreateRecords(currentUser.role)) {
      return { success: false, message: 'Unauthorized: Only SUPER_ADMIN, MANAGER, or ASSOCIATE can create properties' };
    }

    const normalized = normalizePropertyInput(input as FormData | Record<string, unknown>);
    const parsed = PropertySchema.safeParse(normalized);

    if (!parsed.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: parsed.error.flatten(),
      };
    }

    const data = parsed.data;

    // Determine Verification Status - auto-approve if user can approve records
    const verificationStatus = canApproveRecords(currentUser.role) 
      ? VerificationStatus.APPROVED 
      : VerificationStatus.PENDING;

    // 1. Verify owner exists
    const owner: Client | null = await prisma.client.findUnique({
      where: { id: data.ownerId },
    });

    if (!owner) {
      return {
        success: false,
        message: 'Owner not found for provided ownerId',
      };
    }

    // 2. Transaction: Property + Units + Documents + AuditLog
    const property = await prisma.$transaction(async (tx) => {
      const created = await tx.property.create({
        data: {
          address: data.address,
          city: data.city,
          state: data.state,
          titleType: data.titleType,
          registrationNumber: data.registrationNumber,
          surveyNumber: data.surveyNumber || null,
          plotNumber: data.plotNumber || null,
          landArea: data.landArea ?? null,
          buildingArea: data.buildingArea ?? null,

          structureType: data.structureType,
          ownerId: data.ownerId,
          verificationStatus,
        },
      });

      // 3. Create units if multi-unit property
      let totalUnitsCreated = 0;
      if (data.units && data.units.length > 0) {
        for (const unitConfig of data.units) {
          const { type, quantity, marketRent, bedrooms, bathrooms } = unitConfig;
          const defaultCounts = getDefaultRoomCounts(type);

          // Generate individual units based on quantity
          for (let i = 0; i < quantity; i++) {
            await tx.propertyUnit.create({
              data: {
                name: generateUnitName(type, i, quantity),
                type,
                bedrooms: bedrooms ?? defaultCounts.bedrooms,
                bathrooms: bathrooms ?? defaultCounts.bathrooms,
                marketRent: marketRent ?? null,
                propertyId: created.id,
              },
            });
            totalUnitsCreated++;
          }
        }
      }

      // 4. Create documents if provided
      if (documents && documents.length > 0) {
        await tx.document.createMany({
          data: documents.map((doc) => ({
            url: doc.url,
            name: doc.name,
            type: doc.type,
            propertyId: created.id,
          })),
        });
      }

      // 5. Audit log
      await tx.auditLog.create({
        data: {
          action: 'CREATE_PROPERTY',
          entityType: 'Property',
          entityId: created.id,
          performedBy: currentUser.id,
          details: {
            propertyId: created.id,
            address: created.address,
            ownerId: created.ownerId,
            structureType: created.structureType,
            unitsCreated: totalUnitsCreated,
            documentsCount: documents?.length || 0,
          },
        },
      });

      // If pending, specific audit log for Maker-Checker
      if (verificationStatus === VerificationStatus.PENDING) {
        await tx.auditLog.create({
          data: {
            action: 'RECORD_SUBMITTED_FOR_APPROVAL',
            entityType: 'Property',
            entityId: created.id,
            performedBy: currentUser.id,
            details: {
              reason: 'Associate creation requires approval',
            },
          },
        });
      }

      return created;
    });

    return {
      success: true,
      message: 'Property created successfully',
      data: property,
    };
  } catch (error) {
    console.error('createProperty error:', error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while creating the property',
    };
  }
}

/**
 * updateProperty
 *
 * - Validates input with Zod (PropertySchema)
 * - Verifies that ownerId refers to an existing Client
 * - Handles unit updates for multi-unit properties
 * - Uses a transaction to update Property + Units + Documents + AuditLog atomically
 */
export async function updateProperty(
  propertyId: string,
  input: FormData | Partial<PropertyInput>,
  documents?: Array<{ url: string; name: string; type: string }>
): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();

    // 🔒 RBAC: Only SUPER_ADMIN, MANAGER, and ASSOCIATE can update properties
    if (!canCreateRecords(currentUser.role)) {
      return { success: false, message: 'Unauthorized: Only SUPER_ADMIN, MANAGER, or ASSOCIATE can update properties' };
    }

    const normalized = normalizePropertyInput(input as FormData | Record<string, unknown>);
    const parsed = PropertySchema.safeParse(normalized);

    if (!parsed.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: parsed.error.flatten(),
      };
    }

    const data = parsed.data;

    // 1. Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!existingProperty) {
      return {
        success: false,
        message: 'Property not found',
      };
    }

    // 2. Verify owner exists
    const owner: Client | null = await prisma.client.findUnique({
      where: { id: data.ownerId },
    });

    if (!owner) {
      return {
        success: false,
        message: 'Owner not found for provided ownerId',
      };
    }

    // 3. Transaction: Property update + Units + Documents + AuditLog
    const property = await prisma.$transaction(async (tx) => {
      const updated = await tx.property.update({
        where: { id: propertyId },
        data: {
          address: data.address,
          city: data.city,
          state: data.state,
          titleType: data.titleType,
          registrationNumber: data.registrationNumber,
          surveyNumber: data.surveyNumber || null,
          plotNumber: data.plotNumber || null,
          landArea: data.landArea ?? null,
          buildingArea: data.buildingArea ?? null,

          structureType: data.structureType,
          ownerId: data.ownerId,
        },
      });

      // If structure type changed to multi-unit, create units
      // Note: This is a simplified approach. In production, you might want
      // more sophisticated unit management (delete/update existing units)
      let totalUnitsCreated = 0;
      if (data.units && data.units.length > 0) {
        // Delete existing units only if structure type changed
        if (existingProperty.structureType !== data.structureType) {
          await tx.propertyUnit.deleteMany({
            where: { propertyId: updated.id },
          });
        }

        // Create new units
        for (const unitConfig of data.units) {
          const { type, quantity, marketRent, bedrooms, bathrooms } = unitConfig;
          const defaultCounts = getDefaultRoomCounts(type);

          for (let i = 0; i < quantity; i++) {
            await tx.propertyUnit.create({
              data: {
                name: generateUnitName(type, i, quantity),
                type,
                bedrooms: bedrooms ?? defaultCounts.bedrooms,
                bathrooms: bathrooms ?? defaultCounts.bathrooms,
                marketRent: marketRent ?? null,
                propertyId: updated.id,
              },
            });
            totalUnitsCreated++;
          }
        }
      }

      // Create new documents if provided
      if (documents && documents.length > 0) {
        await tx.document.createMany({
          data: documents.map((doc) => ({
            url: doc.url,
            name: doc.name,
            type: doc.type,
            propertyId: updated.id,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'UPDATE_PROPERTY',
          entityType: 'Property',
          entityId: updated.id,
          performedBy: currentUser.id,
          details: {
            propertyId: updated.id,
            address: updated.address,
            ownerId: updated.ownerId,
            structureType: updated.structureType,
            unitsCreated: totalUnitsCreated,
            documentsAdded: documents?.length || 0,
            changes: {
              address: data.address !== existingProperty.address,
              city: data.city !== existingProperty.city,
              state: data.state !== existingProperty.state,
              structureType: data.structureType !== existingProperty.structureType,
              ownerId: data.ownerId !== existingProperty.ownerId,
            },
          },
        },
      });

      return updated;
    });

    return {
      success: true,
      message: 'Property updated successfully',
      data: property,
    };
  } catch (error) {
    console.error('updateProperty error:', error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while updating the property',
    };
  }
}

/**
 * getPropertyUnits
 *
 * Fetches units for a specific property for the tenancy form.
 */
export async function getPropertyUnits(propertyId: string) {
  try {
    const units = await prisma.propertyUnit.findMany({
      where: { propertyId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
      }
    });
    return { success: true, units };
  } catch (error) {
    return { success: false, message: "Failed to fetch units" };
  }
}
