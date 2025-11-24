"use server";

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helper';
import { PropertySchema, type PropertyInput } from '@/types/schema';

import type { Client } from '@prisma/client';

import type { ActionResult } from '@/server/actions/client';

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
 * - Uses a transaction to create Property + Documents + AuditLog atomically
 */
export async function createProperty(
  input: FormData | Partial<PropertyInput>,
  documents?: Array<{ url: string; name: string; type: string }>
): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();

    // 🔒 RBAC: Only ADMIN and ASSOCIATE can create properties
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'ASSOCIATE') {
      return { success: false, message: 'Unauthorized: Only ADMIN or ASSOCIATE can create properties' };
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

    // 2. Transaction: Property + Documents + AuditLog
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
          propertyType: data.propertyType,
          ownerId: data.ownerId,
        },
      });

      // Create documents if provided
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
            documentsCount: documents?.length || 0,
          },
        },
      });

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
 * - Uses a transaction to update Property + Documents + AuditLog atomically
 */
export async function updateProperty(
  propertyId: string,
  input: FormData | Partial<PropertyInput>,
  documents?: Array<{ url: string; name: string; type: string }>
): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();

    // 🔒 RBAC: Only ADMIN and ASSOCIATE can update properties
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'ASSOCIATE') {
      return { success: false, message: 'Unauthorized: Only ADMIN or ASSOCIATE can update properties' };
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

    // 3. Transaction: Property update + Documents + AuditLog
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
          propertyType: data.propertyType,
          ownerId: data.ownerId,
        },
      });

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
            documentsAdded: documents?.length || 0,
            changes: {
              address: data.address !== existingProperty.address,
              city: data.city !== existingProperty.city,
              state: data.state !== existingProperty.state,
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
