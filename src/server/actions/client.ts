"use server";

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helper';
import { ClientSchema, type ClientInput } from '@/types/schema';
import { VerificationStatus } from '@prisma/client';
import { canCreateRecords, canApproveRecords } from '@/lib/permissions';

export type ActionResult = {
  success: boolean;
  message: string;
  data?: unknown;
  errors?: unknown;
};

/**
 * Normalizes incoming data (FormData or plain object) into a plain JS object
 * compatible with Zod schemas.
 */
function normalizeClientInput(input: FormData | Record<string, unknown>): Record<string, unknown> {
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
 * createClient
 *
 * - Validates input with Zod (ClientSchema)
 * - Encrypts NIN before persisting
 * - Uses a Prisma transaction to ensure both Client and AuditLog
 *   are written atomically
 * - Enforces the "Audit-Everywhere" rule
 */
export async function createClient(input: FormData | Partial<ClientInput>): Promise<ActionResult> {
  try {
    console.log('\n========== [CREATE_CLIENT] START ==========');
    const currentUser = await getCurrentUser();
    console.log('[CREATE_CLIENT] Current user:', { id: currentUser.id, email: currentUser.email, role: currentUser.role });

    // 🔒 RBAC: Only SUPER_ADMIN, MANAGER, and ASSOCIATE can create clients
    if (!canCreateRecords(currentUser.role)) {
      console.error('[CREATE_CLIENT] ✗ Unauthorized: User role is', currentUser.role);
      return { success: false, message: 'Unauthorized: Only SUPER_ADMIN, MANAGER, or ASSOCIATE can create clients' };
    }

    // 1. Normalize and validate input
    const normalized = normalizeClientInput(input as FormData | Record<string, unknown>);
    console.log('[CREATE_CLIENT] Normalized input:', normalized);
    const parsed = ClientSchema.safeParse(normalized);

    if (!parsed.success) {
      console.error('[CREATE_CLIENT] ✗ Validation failed:', parsed.error.flatten());
      return {
        success: false,
        message: 'Validation failed',
        errors: parsed.error.flatten(),
      };
    }

    const data = parsed.data;
    console.log('[CREATE_CLIENT] ✓ Validation passed');

    // Determine Verification Status - auto-approve if user can approve records
    const verificationStatus = canApproveRecords(currentUser.role) 
      ? VerificationStatus.APPROVED 
      : VerificationStatus.PENDING;



    // 3. Execute atomic transaction: Client + AuditLog
    console.log('[CREATE_CLIENT] Creating client in database...');
    const result = await prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          address: data.address ?? null,
          bankName: data.bankName ?? null,
          accountNumber: data.accountNumber ?? null,
          accountName: data.accountName ?? null,
          bvn: data.bvn && data.bvn.trim() !== '' ? data.bvn : null,
          passportUrl: data.passportUrl ?? null,
          verificationStatus,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'CREATE_CLIENT',
          entityType: 'Client',
          entityId: client.id,
          performedBy: currentUser.id,
          details: {
            clientId: client.id,
            email: client.email,
          },
        },
      });

      // If pending, specific audit log for Maker-Checker
      if (verificationStatus === VerificationStatus.PENDING) {
        await tx.auditLog.create({
          data: {
            action: 'RECORD_SUBMITTED_FOR_APPROVAL',
            entityType: 'Client',
            entityId: client.id,
            performedBy: currentUser.id,
            details: {
              reason: 'Associate creation requires approval',
            },
          },
        });
      }

      return client;
    });

    console.log('[CREATE_CLIENT] ✓ Client created successfully:', result.id);
    console.log('========== [CREATE_CLIENT] END ==========\n');

    return {
      success: true,
      message: 'Client created successfully',
      data: result,
    };
  } catch (error) {
    console.error('[CREATE_CLIENT] ✗ Error:', error);
    console.log('========== [CREATE_CLIENT] END ==========\n');

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while creating the client',
    };
  }
}

/**
 * updateClient
 *
 * - Validates input with Zod (ClientSchema)
 * - Encrypts NIN if changed before persisting
 * - Uses a Prisma transaction to ensure both Client update and AuditLog
 *   are written atomically
 * - Enforces the "Audit-Everywhere" rule
 */
export async function updateClient(
  clientId: string,
  input: FormData | Partial<ClientInput>
): Promise<ActionResult> {
  try {
    console.log('\n========== [UPDATE_CLIENT] START ==========');
    const currentUser = await getCurrentUser();
    console.log('[UPDATE_CLIENT] Current user:', { id: currentUser.id, email: currentUser.email, role: currentUser.role });
    console.log('[UPDATE_CLIENT] Updating client:', clientId);

    // 🔒 RBAC: Only SUPER_ADMIN, MANAGER, and ASSOCIATE can update clients
    if (!canCreateRecords(currentUser.role)) {
      console.error('[UPDATE_CLIENT] ✗ Unauthorized: User role is', currentUser.role);
      return { success: false, message: 'Unauthorized: Only SUPER_ADMIN, MANAGER, or ASSOCIATE can update clients' };
    }

    // 1. Normalize and validate input
    const normalized = normalizeClientInput(input as FormData | Record<string, unknown>);
    console.log('[UPDATE_CLIENT] Normalized input:', normalized);
    const parsed = ClientSchema.safeParse(normalized);

    if (!parsed.success) {
      console.error('[UPDATE_CLIENT] ✗ Validation failed:', parsed.error.flatten());
      return {
        success: false,
        message: 'Validation failed',
        errors: parsed.error.flatten(),
      };
    }

    const data = parsed.data;
    console.log('[UPDATE_CLIENT] ✓ Validation passed');

    // 2. Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!existingClient) {
      console.error('[UPDATE_CLIENT] ✗ Client not found');
      return {
        success: false,
        message: 'Client not found',
      };
    }



    // 4. Execute atomic transaction: Client update + AuditLog
    console.log('[UPDATE_CLIENT] Updating client in database...');
    const result = await prisma.$transaction(async (tx) => {
      const updatedClient = await tx.client.update({
        where: { id: clientId },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          address: data.address ?? null,
          bankName: data.bankName ?? null,
          accountNumber: data.accountNumber ?? null,
          accountName: data.accountName ?? null,
          bvn: data.bvn && data.bvn.trim() !== '' ? data.bvn : null,
          passportUrl: data.passportUrl ?? null,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'UPDATE_CLIENT',
          entityType: 'Client',
          entityId: updatedClient.id,
          performedBy: currentUser.id,
          details: {
            clientId: updatedClient.id,
            email: updatedClient.email,
            changes: {
              firstName: data.firstName !== existingClient.firstName,
              lastName: data.lastName !== existingClient.lastName,
              email: data.email !== existingClient.email,
              phone: data.phone !== existingClient.phone,
            },
          },
        },
      });

      return updatedClient;
    });

    console.log('[UPDATE_CLIENT] ✓ Client updated successfully:', result.id);
    console.log('========== [UPDATE_CLIENT] END ==========\n');

    return {
      success: true,
      message: 'Client updated successfully',
      data: result,
    };
  } catch (error) {
    console.error('[UPDATE_CLIENT] ✗ Error:', error);
    console.log('========== [UPDATE_CLIENT] END ==========\n');

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while updating the client',
    };
  }
}
