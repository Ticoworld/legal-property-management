"use server";

import { prisma } from '@/lib/db';

export type DashboardStats = {
  totalClients: number;
  totalProperties: number;
  expiringSoon: number;
  expired: number;
  actionNeeded: number; // Total requiring attention (expiring + expired)
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const soon = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const [totalClients, totalProperties, expiringSoon, expired] = await Promise.all([
    prisma.client.count(),
    prisma.property.count(),
    prisma.tenancy.count({
      where: {
        expiryDate: {
          gte: now,
          lt: soon,
        },
      },
    }),
    prisma.tenancy.count({
      where: {
        expiryDate: {
          lt: now,
        },
      },
    }),
  ]);

  return { totalClients, totalProperties, expiringSoon, expired, actionNeeded: expiringSoon + expired };
}
