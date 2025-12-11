"use server";

import { prisma } from '@/lib/db';
import { differenceInDays, subMonths } from 'date-fns';
import type { PaymentFrequency } from '@prisma/client';

/**
 * Calculate the suggested notice date based on Lagos Tenancy Law
 * 
 * - ANNUALLY: 6 months before expiry
 * - BI_ANNUALLY: 3 months before expiry
 * - QUARTERLY: 3 months before expiry
 * - MONTHLY: 1 month before expiry
 */
function calculateNoticeDate(expiryDate: Date, frequency: PaymentFrequency | null): Date {
  const expiry = new Date(expiryDate);
  
  switch (frequency) {
    case 'ANNUALLY':
      return subMonths(expiry, 6);
    case 'MONTHLY':
      return subMonths(expiry, 1);
    case 'BI_ANNUALLY':
    case 'QUARTERLY':
      return subMonths(expiry, 3);
    default:
      // Default to 3 months for safety
      return subMonths(expiry, 3);
  }
}

/**
 * getTenancy
 *
 * Fetches a single tenancy by ID with related data and computed financial metrics.
 * Returns null if the tenancy is not found.
 * 
 * Includes:
 * - Property details (address)
 * - All payments ordered by date (descending)
 * - All expenses linked to this tenancy
 * - All maintenance requests linked to this tenancy
 * 
 * Computes:
 * - totalPaid: Sum of all payments (income)
 * - totalExpenses: Sum of all expenses (costs)
 * - netRemittance: totalPaid - totalExpenses (what to remit to landlord)
 * - balance: Annual Rent - Total Paid
 * - daysRemaining: Days until expiry (negative if expired)
 * - suggestedNoticeDate: When to serve notice based on payment frequency
 */
export async function getTenancy(id: string) {
  // Fetch tenancy with property
  const tenancy = await prisma.tenancy.findUnique({
    where: { id },
    include: {
      property: {
        select: {
          id: true,
          address: true,
          city: true,
          state: true,
          owner: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      unit: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });

  if (!tenancy) {
    return null;
  }

  // Fetch payments separately
  const payments = await prisma.payment.findMany({
    where: { tenancyId: id },
    orderBy: { date: 'desc' },
    include: {
      recordedByUser: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // Fetch expenses linked to this tenancy
  const expenses = await prisma.expense.findMany({
    where: { tenancyId: id },
    orderBy: { date: 'desc' },
    include: {
      recordedByUser: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // Fetch maintenance requests linked to this tenancy
  const maintenanceRequests = await prisma.maintenanceRequest.findMany({
    where: { tenancyId: id },
    orderBy: { createdAt: 'desc' },
  });

  // Compute financial metrics
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPaid = payments.reduce((sum: number, payment: any) => {
    return sum + Number(payment.amount);
  }, 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalExpenses = expenses.reduce((sum: number, expense: any) => {
    return sum + Number(expense.amount);
  }, 0);

  // Net remittance = Income - Expenses
  const netRemittance = totalPaid - totalExpenses;

  const annualRent = Number(tenancy.annualRent);
  const balance = annualRent - totalPaid;

  // Compute days remaining
  const today = new Date();
  const expiryDate = new Date(tenancy.expiryDate);
  const daysRemaining = differenceInDays(expiryDate, today);

  // Calculate suggested notice date based on Lagos Tenancy Law
  const suggestedNoticeDate = calculateNoticeDate(
    tenancy.expiryDate,
    tenancy.paymentFrequency
  );

  return {
    ...tenancy,
    payments,
    expenses,
    maintenanceRequests,
    totalPaid,
    balance,
    daysRemaining,
    // New operational fields
    suggestedNoticeDate,
    financials: {
      totalExpenses,
      netRemittance,
    },
  };
}

export type TenancyDetail = NonNullable<Awaited<ReturnType<typeof getTenancy>>>;
