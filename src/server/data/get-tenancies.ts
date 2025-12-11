"use server";

import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

export type TenancyWithCalculations = {
  id: string;
  tenantName: string;
  tenantEmail: string | null;
  tenantPhone: string;
  startDate: Date;
  expiryDate: Date;
  annualRent: Prisma.Decimal;
  securityDeposit: Prisma.Decimal | null;
  status: string;
  property: {
    id: string;
    address: string;
    city: string;
    state: string;
    owner: {
      firstName: string;
      lastName: string;
    };
  };
  unit: {
    name: string;
    type: string;
  } | null;
  paymentFrequency: string;
  daysRemaining: number;
  outstandingBalance: number;
  totalExpenses: number; // New field
  financialStatus: 'PAID' | 'OWING' | 'OVERPAID';
  tenantPassportUrl: string | null;
  verificationStatus: string;
};

export async function getTenancies(): Promise<TenancyWithCalculations[]> {
  const tenancies = await prisma.tenancy.findMany({
    orderBy: {
      expiryDate: 'asc',
    },
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
          name: true,
          type: true,
        },
      },
      payments: {
        select: {
          amount: true,
          type: true,
        },
      },
      expenses: { // Include expenses
        select: {
          amount: true,
        },
      },
    },
  });

  const now = new Date();

  return tenancies.map((tenancy) => {
    // Calculate days remaining
    const daysRemaining = Math.ceil(
      (tenancy.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate total expected (rent + deposit)
    const rentAmount = Number(tenancy.annualRent);
    const depositAmount = tenancy.securityDeposit ? Number(tenancy.securityDeposit) : 0;
    const totalExpected = rentAmount + depositAmount;

    // Calculate total paid
    const totalPaid = tenancy.payments.reduce((sum, payment) => {
      return sum + Number(payment.amount);
    }, 0);

    // Calculate total expenses
    const totalExpenses = tenancy.expenses.reduce((sum, expense) => {
      return sum + Number(expense.amount);
    }, 0);

    // Calculate outstanding balance
    const outstandingBalance = totalExpected - totalPaid;

    // Determine financial status
    let financialStatus: 'PAID' | 'OWING' | 'OVERPAID';
    if (outstandingBalance > 0.01) {
      financialStatus = 'OWING';
    } else if (outstandingBalance < -0.01) {
      financialStatus = 'OVERPAID';
    } else {
      financialStatus = 'PAID';
    }

    return {
      id: tenancy.id,
      tenantName: tenancy.tenantName,
      tenantEmail: tenancy.tenantEmail,
      tenantPhone: tenancy.tenantPhone,
      startDate: tenancy.startDate,
      expiryDate: tenancy.expiryDate,
      annualRent: tenancy.annualRent,
      securityDeposit: tenancy.securityDeposit,
      securityDeposit: tenancy.securityDeposit,
      status: tenancy.status,
      paymentFrequency: tenancy.paymentFrequency,
      unit: tenancy.unit,
      property: tenancy.property,
      daysRemaining,
      outstandingBalance,
      totalExpenses, // Return computed total
      financialStatus,
      tenantPassportUrl: tenancy.tenantPassportUrl,
      verificationStatus: tenancy.verificationStatus,
    };
  });
}

/**
 * getPropertiesForSelect
 *
 * Lightweight fetch for populating the property combobox
 */
export async function getPropertiesForSelect() {
  const properties = await prisma.property.findMany({
    select: {
      id: true,
      address: true,
      owner: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      address: 'asc',
    },
  });

  return properties.map((p) => ({
    id: p.id,
    address: p.address,
    ownerName: `${p.owner.firstName} ${p.owner.lastName}`,
    label: `${p.address} (${p.owner.firstName} ${p.owner.lastName})`,
  }));
}
