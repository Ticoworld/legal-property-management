"use server";

import { prisma } from "@/lib/db";

export async function getAuditLogs() {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 50,
      orderBy: {
        timestamp: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return logs;
  } catch (error) {
    console.error("[GET_AUDIT_LOGS]", error);
    throw new Error("Failed to fetch audit logs");
  }
}
