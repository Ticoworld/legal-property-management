"use server";

import { prisma } from '@/lib/db';
import { differenceInDays } from 'date-fns';

export type NotificationSeverity = 'CRITICAL' | 'WARNING';

export type Notification = {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  link: string;
  daysRemaining: number;
};

/**
 * getNotifications
 * 
 * Fetches system notifications for expiring and expired leases.
 * Returns notifications for tenancies expiring within 30 days or already expired.
 */
export async function getNotifications(): Promise<Notification[]> {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Fetch tenancies expiring within 30 days or already expired
  const tenancies = await prisma.tenancy.findMany({
    where: {
      expiryDate: {
        lte: thirtyDaysFromNow,
      },
      status: {
        in: ['ACTIVE', 'EXPIRED'],
      },
    },
    include: {
      property: {
        select: {
          address: true,
        },
      },
    },
    orderBy: {
      expiryDate: 'asc',
    },
  });

  // Map to notification objects
  const notifications: Notification[] = tenancies.map((tenancy) => {
    const daysRemaining = differenceInDays(tenancy.expiryDate, now);
    const isExpired = daysRemaining < 0;
    
    return {
      id: tenancy.id,
      title: isExpired ? 'Lease Expired' : 'Lease Expiring Soon',
      message: isExpired
        ? `Tenant ${tenancy.tenantName} at ${tenancy.property.address} expired ${Math.abs(daysRemaining)} days ago.`
        : `Tenant ${tenancy.tenantName} at ${tenancy.property.address} expires in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}.`,
      severity: isExpired ? 'CRITICAL' : 'WARNING',
      link: `/tenancies/${tenancy.id}`,
      daysRemaining,
    };
  });

  return notifications;
}
