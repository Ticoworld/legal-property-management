"use server";

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helper';
import { canViewFinancials } from '@/lib/permissions';

export type DashboardStats = {
  totalClients: number;
  totalProperties: number;
  expiringSoon: number;      // Tenancies expiring < 90 days (legacy)
  expired: number;
  actionNeeded: number;      // Total requiring attention (expiring + expired)
  // New executive metrics
  activeIssues: number;      // MaintenanceRequest not CLOSED
  occupancyRate: number;     // (Active Tenancies / Total Units) * 100
  expiringSoon30: number;    // Tenancies expiring in < 30 days
  revenueYTD: number | null; // Revenue is restricted for non-SUPER_ADMIN
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const user = await getCurrentUser();
  const canSeeFinancials = canViewFinancials(user.role);

  const now = new Date();
  const soon90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const soon30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  // Start of current year for YTD revenue
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [
    totalClients,
    totalProperties,
    expiringSoon,
    expired,
    revenueAggregate,
    activeIssues,
    activeTenancies,
    totalUnits,
    expiringSoon30,
  ] = await Promise.all([
    // Legacy metrics
    prisma.client.count(),
    prisma.property.count(),
    prisma.tenancy.count({
      where: {
        status: 'ACTIVE',
        expiryDate: {
          gte: now,
          lt: soon90,
        },
      },
    }),
    prisma.tenancy.count({
      where: {
        status: 'ACTIVE',
        expiryDate: {
          lt: now,
        },
      },
    }),

    // Revenue YTD: Sum of RENT payments in current year (Only fetch for Admin)
    canSeeFinancials 
      ? prisma.payment.aggregate({
          _sum: {
            amount: true,
          },
          where: {
            type: 'RENT',
            date: {
              gte: yearStart,
              lte: now,
            },
          },
        })
      : Promise.resolve({ _sum: { amount: null } }),
    // Active Issues: MaintenanceRequest not CLOSED
    prisma.maintenanceRequest.count({
      where: {
        status: {
          not: 'CLOSED',
        },
      },
    }),
    // Active tenancies for occupancy calculation
    prisma.tenancy.count({
      where: {
        status: 'ACTIVE',
      },
    }),
    // Total property units
    prisma.propertyUnit.count(),
    // Tenancies expiring in < 30 days
    prisma.tenancy.count({
      where: {
        status: 'ACTIVE',
        expiryDate: {
          gte: now,
          lt: soon30,
        },
      },
    }),
  ]);

  // Calculate revenue (Decimal to number conversion) - return null if not admin
  const revenueYTD = canSeeFinancials && revenueAggregate._sum.amount 
    ? Number(revenueAggregate._sum.amount.toString()) 
    : null;

  // Calculate occupancy rate
  // If no units exist, fallback to counting properties with active tenancies
  let occupancyRate = 0;
  if (totalUnits > 0) {
    occupancyRate = Math.round((activeTenancies / totalUnits) * 100);
  } else if (totalProperties > 0) {
    // Fallback for single-unit properties without explicit units
    occupancyRate = Math.round((activeTenancies / totalProperties) * 100);
  }
  // Cap at 100% to handle edge cases
  occupancyRate = Math.min(occupancyRate, 100);

  return {
    totalClients,
    totalProperties,
    expiringSoon,
    expired,
    actionNeeded: expiringSoon + expired,
    revenueYTD,
    activeIssues,
    occupancyRate,
    expiringSoon30,
  };
}
