"use server";

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helper';
import { decrypt } from '@/utils/encryption';
import { revalidatePath } from 'next/cache';

export type ActionResult = {
  success: boolean;
  message: string;
  data?: unknown;
  errors?: unknown;
};

/**
 * NDPR COMPLIANCE: Data Portability (Right to Access)
 * 
 * Exports all data associated with a client including:
 * - Client personal information (with decrypted PII)
 * - All properties owned by the client
 * - All tenancies for those properties
 * - All documents attached to those properties
 * 
 * This function fulfills NDPR Article 8 - Right to Data Portability
 * 
 * @param clientId - The ID of the client whose data to export
 * @returns ActionResult with complete client data or error
 */
export async function exportClientData(clientId: string): Promise<ActionResult> {
  try {
    console.log('\n========== [EXPORT_CLIENT_DATA] START ==========');
    const currentUser = await getCurrentUser();
    console.log('[EXPORT_CLIENT_DATA] Requested by:', { id: currentUser.id, role: currentUser.role });

    // 🔒 RBAC: Only ADMIN can export client data
    if (currentUser.role !== 'ADMIN') {
      console.error('[EXPORT_CLIENT_DATA] ✗ Unauthorized: User role is', currentUser.role);
      return { 
        success: false, 
        message: 'Unauthorized: Only ADMIN can export client data' 
      };
    }

    // Fetch complete client data with all relations
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        properties: {
          include: {
            tenancies: {
              orderBy: { startDate: 'desc' }
            },
            documents: {
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!client) {
      console.error('[EXPORT_CLIENT_DATA] ✗ Client not found:', clientId);
      return { success: false, message: 'Client not found' };
    }

    // 🔓 Decrypt PII for export (NDPR Right to Access requires readable format)
    const exportData = {
      ...client,
      nin: client.nin ? decrypt(client.nin) : null,
      bvn: client.bvn ? decrypt(client.bvn) : null,
      exportedAt: new Date().toISOString(),
      exportedBy: {
        id: currentUser.id,
        email: currentUser.email
      }
    };

    // 📝 Audit Log: Record this data export for compliance
    await prisma.auditLog.create({
      data: {
        action: 'EXPORT_CLIENT_DATA',
        entityType: 'Client',
        entityId: clientId,
        performedBy: currentUser.id,
        details: {
          reason: 'NDPR Data Portability Request (Article 8)',
          clientEmail: client.email,
          propertiesCount: client.properties.length,
          exportTimestamp: new Date().toISOString()
        }
      }
    });

    console.log('[EXPORT_CLIENT_DATA] ✓ Data exported successfully');
    console.log('[EXPORT_CLIENT_DATA] Properties:', client.properties.length);
    console.log('========== [EXPORT_CLIENT_DATA] END ==========\n');

    return { 
      success: true, 
      message: 'Client data exported successfully', 
      data: exportData 
    };
  } catch (error) {
    console.error('[EXPORT_CLIENT_DATA] ✗ Error:', error);
    console.log('========== [EXPORT_CLIENT_DATA] END ==========\n');

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to export client data'
    };
  }
}

/**
 * NDPR COMPLIANCE: Right to Erasure (Right to be Forgotten)
 * 
 * Deletes a client and all associated data with proper safeguards:
 * - Blocks deletion if client has active properties (data integrity)
 * - Logs complete audit trail before deletion (legal requirement)
 * - Captures snapshot of deleted data for compliance records
 * 
 * This function fulfills NDPR Article 10 - Right to Erasure
 * 
 * IMPORTANT: Deletion is blocked if client has properties.
 * Transfer or archive properties before deletion.
 * 
 * @param clientId - The ID of the client to delete
 * @returns ActionResult indicating success or reason for failure
 */
export async function deleteClient(clientId: string): Promise<ActionResult> {
  try {
    console.log('\n========== [DELETE_CLIENT] START ==========');
    const currentUser = await getCurrentUser();
    console.log('[DELETE_CLIENT] Requested by:', { id: currentUser.id, role: currentUser.role });

    // 🔒 RBAC: Only ADMIN can delete clients
    if (currentUser.role !== 'ADMIN') {
      console.error('[DELETE_CLIENT] ✗ Unauthorized: User role is', currentUser.role);
      return { 
        success: false, 
        message: 'Unauthorized: Only ADMIN can delete clients' 
      };
    }

    // Fetch client with property count
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        properties: {
          include: {
            tenancies: { select: { id: true, status: true } },
            documents: { select: { id: true } }
          }
        }
      }
    });

    if (!client) {
      console.error('[DELETE_CLIENT] ✗ Client not found:', clientId);
      return { success: false, message: 'Client not found' };
    }

    // 🛡️ Data Integrity Check: Block deletion if client has properties
    if (client.properties.length > 0) {
      const activeTenancies = client.properties.reduce(
        (count, prop) => count + prop.tenancies.filter(t => t.status === 'ACTIVE').length,
        0
      );

      console.error('[DELETE_CLIENT] ✗ Client has properties:', {
        propertiesCount: client.properties.length,
        activeTenancies
      });

      return {
        success: false,
        message: `Cannot delete client with ${client.properties.length} ${
          client.properties.length === 1 ? 'property' : 'properties'
        }${activeTenancies > 0 ? ` and ${activeTenancies} active ${activeTenancies === 1 ? 'tenancy' : 'tenancies'}` : ''}. Please transfer ownership or archive properties first.`
      };
    }

    // 🗑️ Perform deletion with full audit trail
    await prisma.$transaction(async (tx) => {
      // 📝 Create audit log BEFORE deletion (preserves data for compliance)
      await tx.auditLog.create({
        data: {
          action: 'DELETE_CLIENT',
          entityType: 'Client',
          entityId: clientId,
          performedBy: currentUser.id,
          details: {
            reason: 'NDPR Right to Erasure (Article 10)',
            deletedData: {
              id: client.id,
              firstName: client.firstName,
              lastName: client.lastName,
              email: client.email,
              phone: client.phone,
              address: client.address,
              hasNIN: !!client.nin,
              hasBVN: !!client.bvn,
              createdAt: client.createdAt,
              updatedAt: client.updatedAt
            },
            deletionTimestamp: new Date().toISOString(),
            deletedBy: {
              id: currentUser.id,
              email: currentUser.email
            }
          }
        }
      });

      // 🗑️ Delete the client record
      await tx.client.delete({
        where: { id: clientId }
      });
    });

    console.log('[DELETE_CLIENT] ✓ Client deleted successfully:', clientId);
    console.log('========== [DELETE_CLIENT] END ==========\n');

    // Revalidate client list page
    revalidatePath('/clients');

    return { 
      success: true, 
      message: 'Client deleted successfully. Audit log preserved for compliance.' 
    };
  } catch (error) {
    console.error('[DELETE_CLIENT] ✗ Error:', error);
    console.log('========== [DELETE_CLIENT] END ==========\n');

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete client'
    };
  }
}

/**
 * NDPR COMPLIANCE: Property Deletion with Safeguards
 * 
 * Deletes a property with proper checks:
 * - Blocks deletion if property has active tenancies (legal/historical preservation)
 * - Logs complete audit trail before deletion
 * - Removes associated documents (if storage cleanup is needed)
 * 
 * NOTE: Due to schema change (onDelete: Restrict), tenancies must be
 * manually archived or terminated before property deletion.
 * 
 * @param propertyId - The ID of the property to delete
 * @returns ActionResult indicating success or reason for failure
 */
export async function deleteProperty(propertyId: string): Promise<ActionResult> {
  try {
    console.log('\n========== [DELETE_PROPERTY] START ==========');
    const currentUser = await getCurrentUser();
    console.log('[DELETE_PROPERTY] Requested by:', { id: currentUser.id, role: currentUser.role });

    // 🔒 RBAC: Only ADMIN can delete properties
    if (currentUser.role !== 'ADMIN') {
      console.error('[DELETE_PROPERTY] ✗ Unauthorized: User role is', currentUser.role);
      return { 
        success: false, 
        message: 'Unauthorized: Only ADMIN can delete properties' 
      };
    }

    // Fetch property with relations
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        tenancies: { select: { id: true, status: true, tenantName: true } },
        documents: { select: { id: true, name: true, url: true } }
      }
    });

    if (!property) {
      console.error('[DELETE_PROPERTY] ✗ Property not found:', propertyId);
      return { success: false, message: 'Property not found' };
    }

    // 🛡️ Legal Safeguard: Block deletion if active tenancies exist
    const activeTenancies = property.tenancies.filter(t => t.status === 'ACTIVE' || t.status === 'RENEWED');
    
    if (activeTenancies.length > 0) {
      console.error('[DELETE_PROPERTY] ✗ Property has active tenancies:', {
        propertyId,
        activeTenancies: activeTenancies.length
      });

      return {
        success: false,
        message: `Cannot delete property with ${activeTenancies.length} active ${
          activeTenancies.length === 1 ? 'tenancy' : 'tenancies'
        }. Please terminate or expire tenancies first.`
      };
    }

    // ⚠️ Historical Record Check: Warn if property has ANY tenancies
    if (property.tenancies.length > 0) {
      console.warn('[DELETE_PROPERTY] ⚠ Property has historical tenancies:', {
        propertyId,
        totalTenancies: property.tenancies.length
      });

      return {
        success: false,
        message: `Property has ${property.tenancies.length} historical ${
          property.tenancies.length === 1 ? 'tenancy record' : 'tenancy records'
        }. Due to legal record preservation requirements (onDelete: Restrict), please archive or transfer tenancies before deletion.`
      };
    }

    // 🗑️ Perform deletion with full audit trail
    await prisma.$transaction(async (tx) => {
      // 📝 Create audit log BEFORE deletion
      await tx.auditLog.create({
        data: {
          action: 'DELETE_PROPERTY',
          entityType: 'Property',
          entityId: propertyId,
          performedBy: currentUser.id,
          details: {
            reason: 'Property deletion by ADMIN',
            deletedData: {
              id: property.id,
              address: property.address,
              city: property.city,
              state: property.state,
              titleType: property.titleType,
              registrationNumber: property.registrationNumber,
              propertyType: property.propertyType,
              owner: {
                id: property.owner.id,
                name: `${property.owner.firstName} ${property.owner.lastName}`,
                email: property.owner.email
              },
              documentsCount: property.documents.length,
              tenanciesCount: property.tenancies.length,
              createdAt: property.createdAt,
              updatedAt: property.updatedAt
            },
            deletionTimestamp: new Date().toISOString(),
            deletedBy: {
              id: currentUser.id,
              email: currentUser.email
            }
          }
        }
      });

      // 🗑️ Delete documents first (due to foreign key constraint)
      if (property.documents.length > 0) {
        await tx.document.deleteMany({
          where: { propertyId }
        });
        console.log('[DELETE_PROPERTY] ✓ Deleted documents:', property.documents.length);
      }

      // 🗑️ Delete the property record
      await tx.property.delete({
        where: { id: propertyId }
      });
    });

    console.log('[DELETE_PROPERTY] ✓ Property deleted successfully:', propertyId);
    console.log('========== [DELETE_PROPERTY] END ==========\n');

    // Revalidate property list page
    revalidatePath('/properties');

    return { 
      success: true, 
      message: 'Property deleted successfully. Audit log preserved for compliance.' 
    };
  } catch (error) {
    console.error('[DELETE_PROPERTY] ✗ Error:', error);
    console.log('========== [DELETE_PROPERTY] END ==========\n');

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete property'
    };
  }
}
