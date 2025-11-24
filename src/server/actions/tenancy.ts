"use server";

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helper';
import { TenancySchema, type TenancyInput } from '@/types/schema';

export type ActionResult = {
  success: boolean;
  message: string;
  data?: unknown;
  errors?: unknown;
};

function normalizeTenancyInput(input: FormData | Record<string, unknown>): Record<string, unknown> {
  if (input instanceof FormData) {
    const obj: Record<string, unknown> = {};
    input.forEach((value, key) => {
      obj[key] = typeof value === 'string' ? value : value.toString();
    });
    return obj;
  }
  return input;
}

function toMoneyString(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  const num = typeof v === 'number' ? v : Number(v);
  if (Number.isNaN(num)) return null;
  return num.toFixed(2);
}

export async function createTenancy(input: FormData | Partial<TenancyInput>): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();

    // Normalize and coerce numeric fields expected by schema
    const raw = normalizeTenancyInput(input as FormData | Record<string, unknown>);
    if (raw['annualRent'] !== undefined) raw['annualRent'] = Number(raw['annualRent']);
    if (raw['securityDeposit'] !== undefined && raw['securityDeposit'] !== '') {
      raw['securityDeposit'] = Number(raw['securityDeposit']);
    }

    const parsed = TenancySchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, message: 'Validation failed', errors: parsed.error.flatten() };
    }

    const data = parsed.data;

    // Ensure property exists
    const property = await prisma.property.findUnique({ where: { id: data.propertyId } });
    if (!property) {
      return { success: false, message: 'Property not found for provided propertyId' };
    }

    const tenancy = await prisma.$transaction(async (tx) => {
      const created = await tx.tenancy.create({
        data: {
          tenantName: data.tenantName,
          tenantEmail: data.tenantEmail || null,
          tenantPhone: data.tenantPhone,
          startDate: data.startDate,
          expiryDate: data.expiryDate,
          annualRent: toMoneyString(data.annualRent)!,
          status: data.status ?? 'ACTIVE',
          paymentFrequency: data.paymentFrequency || null,
          securityDeposit: toMoneyString(data.securityDeposit),
          propertyId: data.propertyId,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'NEW_LEASE',
          entityType: 'Tenancy',
          entityId: created.id,
          performedBy: currentUser.id,
          details: {
            tenancyId: created.id,
            propertyId: created.propertyId,
            startDate: created.startDate,
            expiryDate: created.expiryDate,
          },
        },
      });

      return created;
    });

    return { success: true, message: 'Tenancy created successfully', data: tenancy };
  } catch (error) {
    console.error('createTenancy error:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unexpected error' };
  }
}

export async function renewTenancy(
  tenancyId: string,
  newEndDate: Date | string,
  newRent?: number | string,
): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (currentUser.role !== 'ADMIN') {
      return { success: false, message: 'Unauthorized' };
    }

    const tenancy = await prisma.tenancy.findUnique({ where: { id: tenancyId } });
    if (!tenancy) return { success: false, message: 'Tenancy not found' };

    const newExpiry = new Date(newEndDate);
    if (Number.isNaN(newExpiry.getTime())) return { success: false, message: 'Invalid new end date' };

    const updated = await prisma.$transaction(async (tx) => {
      const before = {
        expiryDate: tenancy.expiryDate,
        annualRent: tenancy.annualRent,
        status: tenancy.status,
      };

      const after = await tx.tenancy.update({
        where: { id: tenancyId },
        data: {
          expiryDate: newExpiry,
          ...(newRent !== undefined ? { annualRent: toMoneyString(newRent)! } : {}),
          status: 'RENEWED',
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'RENEW_LEASE',
          entityType: 'Tenancy',
          entityId: tenancyId,
          performedBy: currentUser.id,
          details: {
            tenancyId,
            oldExpiryDate: before.expiryDate,
            newExpiryDate: after.expiryDate,
            oldAnnualRent: before.annualRent,
            newAnnualRent: newRent !== undefined ? toMoneyString(newRent) : undefined,
          },
        },
      });

      return after;
    });

    return { success: true, message: 'Tenancy renewed successfully', data: updated };
  } catch (error) {
    console.error('renewTenancy error:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unexpected error' };
  }
}
