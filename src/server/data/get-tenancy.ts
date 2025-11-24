"use server";

import { prisma } from '@/lib/db';
import { differenceInDays } from 'date-fns';

/**
 * getTenancy
 *
 * Fetches a single tenancy by ID with related data and computed financial metrics.
 * Returns null if the tenancy is not found.
 * 
 * Includes:
 * - Property details (address)
 * - All payments ordered by date (descending)
 * 
 * Computes:
 * - totalPaid: Sum of all payments
 * - balance: Annual Rent - Total Paid
 * - daysRemaining: Days until expiry (negative if expired)
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

  // Compute financial metrics
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPaid = payments.reduce((sum: number, payment: any) => {
    return sum + Number(payment.amount);
  }, 0);

  const annualRent = Number(tenancy.annualRent);
  const balance = annualRent - totalPaid;

  // Compute days remaining
  const today = new Date();
  const expiryDate = new Date(tenancy.expiryDate);
  const daysRemaining = differenceInDays(expiryDate, today);

  return {
    ...tenancy,
    payments,
    totalPaid,
    balance,
    daysRemaining,
  };
}

export type TenancyDetail = NonNullable<Awaited<ReturnType<typeof getTenancy>>>;
