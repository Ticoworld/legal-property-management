"use server";

// Note: TypeScript errors related to Payment model will resolve after VS Code restarts its TS server
// The Prisma Client has been regenerated with the Payment model, but IDE cache needs refresh
/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helper';
import { PaymentSchema, type PaymentInput } from '@/types/schema';

export type ActionResult = {
  success: boolean;
  message: string;
  data?: unknown;
  errors?: unknown;
};

/**
 * Record a payment received from a tenant
 * 
 * Security:
 * - RBAC: Only ADMIN and ASSOCIATE can record payments
 * - Validates payment data with Zod schema
 * - Creates audit trail for every payment
 * - Uses transaction for atomicity
 * 
 * @param input - Payment data (FormData or object)
 * @returns ActionResult with payment data or error
 */
export async function recordPayment(input: FormData | Partial<PaymentInput>): Promise<ActionResult> {
  try {
    // 1. Authentication & Authorization
    const currentUser = await getCurrentUser();
    
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'ASSOCIATE') {
      return { 
        success: false, 
        message: 'Unauthorized. Only Admins and Associates can record payments.' 
      };
    }

    // 2. Normalize input (handle FormData)
    const raw = normalizePaymentInput(input);
    
    // Coerce numeric field
    if (raw['amount'] !== undefined) {
      raw['amount'] = Number(raw['amount']);
    }
    
    // Set recordedBy to current user
    raw['recordedBy'] = currentUser.id;

    // 3. Validate with Zod
    const parsed = PaymentSchema.safeParse(raw);
    if (!parsed.success) {
      return { 
        success: false, 
        message: 'Validation failed', 
        errors: parsed.error.flatten() 
      };
    }

    const data = parsed.data;

    // 4. Verify tenancy exists
    const tenancy = await prisma.tenancy.findUnique({ 
      where: { id: data.tenancyId },
      include: {
        property: {
          include: {
            owner: true
          }
        }
      }
    });
    
    if (!tenancy) {
      return { 
        success: false, 
        message: 'Tenancy not found' 
      };
    }

    // 5. Create payment record + audit log (atomic transaction)
    const payment = await prisma.$transaction(async (tx) => {
      // Create payment - TypeScript workaround for new model
      const created = await (tx as any).payment.create({
        data: {
          amount: toDecimalString(data.amount)!,
          date: data.date,
          type: data.type,
          method: data.method,
          reference: data.reference || null,
          notes: data.notes || null,
          tenancyId: data.tenancyId,
          recordedBy: currentUser.id,
        },
        include: {
          tenancy: {
            include: {
              property: true
            }
          },
          recordedByUser: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'PAYMENT_RECEIVED',
          entityType: 'Payment',
          entityId: created.id,
          performedBy: currentUser.id,
          details: {
            paymentId: created.id,
            tenancyId: created.tenancyId,
            amount: created.amount.toString(),
            type: created.type,
            method: created.method,
            reference: created.reference,
            tenantName: tenancy.tenantName,
            propertyAddress: tenancy.property.address,
            landlordName: `${tenancy.property.owner.firstName} ${tenancy.property.owner.lastName}`,
          },
        },
      });

      return created;
    });

    // Serialize Decimal fields for client component compatibility
    const serializedPayment = {
      ...payment,
      amount: Number(payment.amount),
      tenancy: {
        ...payment.tenancy,
        annualRent: Number(payment.tenancy.annualRent),
        securityDeposit: payment.tenancy.securityDeposit ? Number(payment.tenancy.securityDeposit) : null,
      }
    };

    return { 
      success: true, 
      message: `Payment of ₦${data.amount.toLocaleString()} recorded successfully`, 
      data: serializedPayment 
    };

  } catch (error) {
    console.error('recordPayment error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unexpected error recording payment' 
    };
  }
}

/**
 * Get all payments for a specific tenancy
 * 
 * @param tenancyId - The tenancy ID
 * @returns ActionResult with payments array
 */
export async function getPaymentsByTenancy(tenancyId: string): Promise<ActionResult> {
  try {
    const payments = await (prisma as any).payment.findMany({
      where: { tenancyId },
      include: {
        recordedByUser: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Calculate financial summary
    const totalPaid = payments.reduce((sum: number, p: { amount: unknown }) => sum + Number(p.amount), 0);
    
    const tenancy = await prisma.tenancy.findUnique({
      where: { id: tenancyId },
      select: {
        annualRent: true,
        securityDeposit: true
      }
    });

    const totalDue = tenancy 
      ? Number(tenancy.annualRent) + Number(tenancy.securityDeposit || 0)
      : 0;

    const balance = totalDue - totalPaid;

    return {
      success: true,
      message: 'Payments retrieved successfully',
      data: {
        payments,
        summary: {
          totalDue,
          totalPaid,
          balance,
          paymentCount: payments.length
        }
      }
    };

  } catch (error) {
    console.error('getPaymentsByTenancy error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve payments'
    };
  }
}

/**
 * Calculate financial balance for a tenancy
 * 
 * @param tenancyId - The tenancy ID
 * @returns Financial summary with balance calculation
 */
export async function calculateTenancyBalance(tenancyId: string): Promise<ActionResult> {
  try {
    const tenancy = await prisma.tenancy.findUnique({
      where: { id: tenancyId },
      include: {
        payments: {
          select: {
            amount: true,
            type: true
          }
        }
      } as any, // TypeScript workaround until TS recognizes Payment relation
    });

    if (!tenancy) {
      return {
        success: false,
        message: 'Tenancy not found'
      };
    }

    // Calculate totals by payment type
    // TypeScript workaround: Cast to any until TS server recognizes new Payment relation
    const tenancyWithPayments = tenancy as typeof tenancy & { payments: Array<{ amount: unknown; type: string }> };
    
    const paymentsByType = tenancyWithPayments.payments.reduce((acc: Record<string, number>, p) => {
      const key = p.type;
      acc[key] = (acc[key] || 0) + Number(p.amount);
      return acc;
    }, {} as Record<string, number>);

    const totalPaid = tenancyWithPayments.payments.reduce((sum: number, p) => sum + Number(p.amount), 0);
    const totalDue = Number(tenancy.annualRent) + Number(tenancy.securityDeposit || 0);
    const balance = totalDue - totalPaid;

    return {
      success: true,
      message: 'Balance calculated successfully',
      data: {
        totalDue,
        totalPaid,
        balance,
        percentagePaid: totalDue > 0 ? (totalPaid / totalDue) * 100 : 0,
        paymentsByType,
        status: balance > 0 ? 'OUTSTANDING' : balance < 0 ? 'OVERPAID' : 'FULLY_PAID'
      }
    };

  } catch (error) {
    console.error('calculateTenancyBalance error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to calculate balance'
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function normalizePaymentInput(input: FormData | Record<string, unknown>): Record<string, unknown> {
  if (input instanceof FormData) {
    const obj: Record<string, unknown> = {};
    input.forEach((value, key) => {
      obj[key] = typeof value === 'string' ? value : value.toString();
    });
    return obj;
  }
  return input;
}

function toDecimalString(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  const num = typeof v === 'number' ? v : Number(v);
  if (Number.isNaN(num)) return null;
  return num.toFixed(2);
}
