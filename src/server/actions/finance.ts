"use server";
import { revalidatePath } from 'next/cache';

// Note: TypeScript errors related to Payment model will resolve after VS Code restarts its TS server
// The Prisma Client has been regenerated with the Payment model, but IDE cache needs refresh
/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helper';
import { PaymentSchema, type PaymentInput } from '@/types/schema';
import { sendPaymentReceiptEmail } from '@/server/actions/email';
import { formatNaira } from '@/lib/utils';
import { canCreateRecords } from '@/lib/permissions';
import { getFirmSettings } from '@/server/actions/settings';
import { ExpenseSchema, type ExpenseInput } from '@/types/schema';

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
 * - RBAC: Only SUPER_ADMIN, MANAGER, and ASSOCIATE can record payments
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
    
    if (!canCreateRecords(currentUser.role)) {
      return { 
        success: false, 
        message: 'Unauthorized. Only SUPER_ADMIN, MANAGER, and Associates can record payments.' 
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
      // Create payment
      const created = await tx.payment.create({
        data: {
          amount: data.amount, // Prisma handles number -> Decimal automatically
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

    // Send payment receipt email (non-blocking)
    // Use void pattern to avoid blocking the UI response
    if (tenancy.tenantEmail) {
      void (async () => {
        try {
          const emailResult = await sendPaymentReceiptEmail({
            tenantName: tenancy.tenantName,
            tenantEmail: tenancy.tenantEmail!,
            amount: formatNaira(data.amount.toString()),
            propertyAddress: `${tenancy.property.address}, ${tenancy.property.city || ''}`.trim(),
            date: data.date,
            paymentType: data.type,
            paymentId: payment.id,
          });

          // Log email send attempt
          if (emailResult.success) {
            await prisma.auditLog.create({
              data: {
                action: 'EMAIL_SENT_RECEIPT',
                entityType: 'Payment',
                entityId: payment.id,
                performedBy: currentUser.id,
                details: {
                  tenantEmail: tenancy.tenantEmail,
                  emailId: emailResult.emailId,
                },
              },
            });
          }
        } catch (emailError) {
          console.error('Failed to send payment receipt email:', emailError);
        }
      })();
    }

    // Valid paths to revalidate
    revalidatePath(`/tenancies/${data.tenancyId}`);
    revalidatePath('/tenancies');

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
 * Record an expense for a property or tenancy
 * 
 * Security:
 * - RBAC: Only SUPER_ADMIN, MANAGER, and ASSOCIATE can record expenses
 * - Validates input with ExpenseSchema
 * - Creates audit trail
 */

export async function recordExpense(input: FormData | Partial<ExpenseInput>): Promise<ActionResult> {
  try {
    // 1. Authentication & Authorization
    const currentUser = await getCurrentUser();
    
    if (!canCreateRecords(currentUser.role)) {
      return { 
        success: false, 
        message: 'Unauthorized. Only SUPER_ADMIN, MANAGER, and Associates can record expenses.' 
      };
    }

    // 2. Normalize input
    const raw = normalizePaymentInput(input);
    if (raw['amount'] !== undefined) raw['amount'] = Number(raw['amount']);
    if (raw['date'] && typeof raw['date'] === 'string') raw['date'] = new Date(raw['date']);
    
    // Set recordedBy
    raw['recordedBy'] = currentUser.id;

    // 3. Validate
    const parsed = ExpenseSchema.safeParse(raw);
    if (!parsed.success) {
      return { 
        success: false, 
        message: 'Validation failed', 
        errors: parsed.error.flatten() 
      };
    }

    const data = parsed.data;

    // 4. Create expense + audit log
    const expense = await prisma.$transaction(async (tx) => {
      const created = await tx.expense.create({
        data: {
          amount: data.amount,
          date: data.date,
          category: data.category,
          description: data.description,
          propertyId: data.propertyId,
          tenancyId: data.tenancyId || null,
          recordedBy: currentUser.id,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'EXPENSE_RECORDED',
          entityType: 'Expense',
          entityId: created.id,
          performedBy: currentUser.id,
          details: {
            expenseId: created.id,
            amount: created.amount.toString(),
            category: created.category,
            propertyId: created.propertyId,
            tenancyId: created.tenancyId,
          },
        },
      });

      return created;
    });

    const serializedExpense = {
      ...expense,
      amount: Number(expense.amount),
    };

    revalidatePath(`/properties/${data.propertyId}`);
    if (data.tenancyId) {
      revalidatePath(`/tenancies/${data.tenancyId}`);
    }
    revalidatePath('/properties');
    revalidatePath('/tenancies');

    return {
      success: true,
      message: `Expense of ₦${data.amount.toLocaleString()} recorded successfully`,
      data: serializedExpense
    };

  } catch (error) {
    console.error('recordExpense error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unexpected error recording expense'
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
    const payments = await prisma.payment.findMany({
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
      }
    });

    if (!tenancy) {
      return {
        success: false,
        message: 'Tenancy not found'
      };
    }

    // Calculate totals by payment type
    const paymentsByType = tenancy.payments.reduce((acc: Record<string, number>, p) => {
      const key = p.type;
      acc[key] = (acc[key] || 0) + Number(p.amount);
      return acc;
    }, {} as Record<string, number>);

    const totalPaid = tenancy.payments.reduce((sum: number, p) => sum + Number(p.amount), 0);
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

/**
 * Generate Remittance Report Data
 * Aggregates income and expenses for a client's properties within a date range.
 */

export async function generateRemittanceReport(
  clientId: string,
  startDate: Date,
  endDate: Date
): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();
    // RBAC: Only authorized roles
    if (!['SUPER_ADMIN', 'MANAGER', 'ASSOCIATE'].includes(currentUser.role)) {
       return { success: false, message: 'Unauthorized to generate reports' };
    }

    // 1. Fetch Client info
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { firstName: true, lastName: true, email: true, address: true }
    });

    if (!client) return { success: false, message: 'Client not found' };

    // 2. Fetch Firm Settings
    const firmSettings = await getFirmSettings();

    // 3. Fetch Properties owned by client
    const properties = await prisma.property.findMany({
      where: { ownerId: clientId },
      select: { id: true, address: true }
    });
    
    const propertyIds = properties.map(p => p.id);

    if (propertyIds.length === 0) {
        return {
            success: true,
            message: 'No properties found for this client',
            data: {
                client,
                firmSettings,
                payments: [],
                expenses: [],
                summary: { totalIncome: 0, totalExpenses: 0, netRemittance: 0 }
            }
        };
    }

    // 4. Fetch Payments (Income)
    // Linked to tenancies which are linked to these properties
    // Filter by date range
    const payments = await prisma.payment.findMany({
      where: {
        tenancy: {
          propertyId: { in: propertyIds }
        },
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        tenancy: {
          include: {
            property: { select: { address: true } }
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    // 5. Fetch Expenses
    // Linked directly to property OR specific tenancies of these properties
    const expenses = await prisma.expense.findMany({
        where: {
            propertyId: { in: propertyIds },
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        include: {
            property: { select: { address: true } }
        },
        orderBy: { date: 'asc' }
    });

    // 6. Calculate Totals
    const totalIncome = payments.reduce((sum: number, p: { amount: unknown }) => sum + Number(p.amount), 0);
    const totalExpenses = expenses.reduce((sum: number, e: { amount: unknown }) => sum + Number(e.amount), 0);
    const netRemittance = totalIncome - totalExpenses;

    const serialize = (obj: any) => JSON.parse(JSON.stringify(obj, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
    ));

    return {
        success: true,
        message: 'Remittance report generated successfully',
        data: {
            client,
            firmSettings,
            payments: serialize(payments),
            expenses: serialize(expenses),
            summary: {
                totalIncome,
                totalExpenses,
                netRemittance
            },
            period: {
                start: startDate,
                end: endDate
            }
        }
    };

  } catch (error) {
    console.error('generateRemittanceReport error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate report'
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


