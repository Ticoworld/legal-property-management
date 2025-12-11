"use server";

import { prisma } from "@/lib/db";
import { addDays, startOfDay, endOfDay, format } from "date-fns";
import { sendDailyBriefing } from "@/server/actions/email";
import { getFirmSettings } from "@/server/actions/settings"; // Admin email source? Or iterate all admins?
// Note: For now we will send to the email in FirmSettings or a hardcoded Admin email if multiple. 
// Ideally we should find all users with role SUPER_ADMIN.

export type BriefingData = {
  noticesDue: Array<{
    id: string;
    tenantName: string;
    address: string;
    suggestedDate: string;
  }>;
  expiringLeases: Array<{
    id: string;
    tenantName: string;
    address: string;
    endDate: string;
    daysRemaining: number;
  }>;
  maintenanceCount: number;
  date: string;
};

/**
 * Get data for the Daily Briefing
 */
export async function getDailyBriefingData(): Promise<BriefingData> {
  const today = new Date();

  // Determine critical dates for notices
  // Annual Recurrency: 6 months notice (approx 180 days)
  const sixMonthsStart = startOfDay(addDays(today, 180));
  const sixMonthsEnd = endOfDay(addDays(today, 181)); // Window of 2 days

  // Monthly Recurrency: 1 month notice (approx 30 days)
  const oneMonthStart = startOfDay(addDays(today, 30));
  const oneMonthEnd = endOfDay(addDays(today, 31));

  // 1. Fetch potential notices
  // We look for tenancies expiring in 6 months OR 1 month
  const potentialNotices = await prisma.tenancy.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        {
          expiryDate: {
            gte: sixMonthsStart,
            lte: sixMonthsEnd,
          },
          paymentFrequency: "ANNUALLY"
        },
        {
          expiryDate: {
            gte: oneMonthStart,
            lte: oneMonthEnd,
          },
          paymentFrequency: "MONTHLY"
        }
      ]
    },
    include: {
      property: { select: { address: true } },
    },
  });

  // 2. Expiring Leases (Exactly 30 days from now)
  const thirtyDaysFromNowStart = startOfDay(addDays(today, 30));
  const thirtyDaysFromNowEnd = endOfDay(addDays(today, 30));
  
  const expiries = await prisma.tenancy.findMany({
    where: {
      status: "ACTIVE",
      expiryDate: {
        gte: thirtyDaysFromNowStart,
        lte: thirtyDaysFromNowEnd,
      },
    },
    include: {
        property: { select: { address: true } },
    }
  });

  // 3. Maintenance Requests (Open)
  const maintenanceCount = await prisma.maintenanceRequest.count({
    where: {
      status: "OPEN",
    },
  });

  return {
    noticesDue: potentialNotices.map((t) => ({
      id: t.id,
      tenantName: t.tenantName,
      address: t.property.address,
      suggestedDate: format(today, "MMM dd, yyyy"), // Due Today
    })),
    expiringLeases: expiries.map((t) => ({
      id: t.id,
      tenantName: t.tenantName,
      address: t.property.address,
      endDate: format(t.expiryDate, "MMM dd, yyyy"),
      daysRemaining: 30,
    })),
    maintenanceCount,
    date: format(today, "MMM dd, yyyy"),
  };
}

/**
 * Process the Daily Briefing
 * Fetches data and sends email if action items exist.
 */
export async function processDailyBriefing(manualTriggerEmail?: string) {
  try {
    const data = await getDailyBriefingData();
    const hasItems =
      data.noticesDue.length > 0 ||
      data.expiringLeases.length > 0 ||
      data.maintenanceCount > 0;

    // Determine recipient
    // If manual trigger, use that. Else find Super Admins.
    let recipients: string[] = [];

    if (manualTriggerEmail) {
        recipients = [manualTriggerEmail];
    } else {
        const admins = await prisma.user.findMany({
            where: { role: "SUPER_ADMIN" },
            select: { email: true }
        });
        recipients = admins.map(u => u.email);
    }

    if (recipients.length === 0) {
        return { success: false, message: "No recipients found" };
    }

    // Send to all recipients
    const results = await Promise.all(recipients.map(email => 
        sendDailyBriefing(email, data)
    ));

    const failures = results.filter(r => !r.success);

    return {
      success: failures.length === 0,
      message: `Briefing sent to ${recipients.length} recipients. Items found: ${hasItems}`,
      itemCount: data.noticesDue.length + data.expiringLeases.length + data.maintenanceCount
    };
  } catch (error) {
    console.error("processDailyBriefing error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to process briefing",
    };
  }
}
