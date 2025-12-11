"use server";

import { prisma } from '@/lib/db';

export type ExpenseWithDetails = {
  id: string;
  date: Date;
  amount: number;
  description: string;
  category: string;
  propertyAddress: string;
  recordedByName: string;
};

export type ExpensesResult = {
  expenses: ExpenseWithDetails[];
  totalYTD: number;
  totalCount: number;
};

/**
 * getExpenses
 *
 * Fetches all expenses for the expenses page.
 * Includes YTD total calculation.
 */
export async function getExpenses(): Promise<ExpensesResult> {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const expenses = await prisma.expense.findMany({
    orderBy: {
      date: 'desc',
    },
    take: 100, // Limit for performance
    include: {
      property: {
        select: {
          address: true,
        },
      },
      recordedByUser: {
        select: {
          name: true,
        },
      },
    },
  });

  // Calculate YTD total
  const ytdExpenses = await prisma.expense.aggregate({
    where: {
      date: {
        gte: yearStart,
      },
    },
    _sum: {
      amount: true,
    },
  });

  const totalYTD = ytdExpenses._sum.amount ? Number(ytdExpenses._sum.amount) : 0;

  return {
    expenses: expenses.map((e) => ({
      id: e.id,
      date: e.date,
      amount: Number(e.amount),
      description: e.description,
      category: e.category,
      propertyAddress: e.property.address,
      recordedByName: e.recordedByUser.name || 'Unknown',
    })),
    totalYTD,
    totalCount: expenses.length,
  };
}
