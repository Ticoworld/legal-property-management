import type { ReactNode } from "react";
import { auth } from "@/auth";
import DashboardShell from "@/components/layout/dashboard-shell";
import { getDashboardStats } from "@/server/data/get-dashboard";
import { getNotifications } from "@/server/data/get-notifications";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  const [stats, notifications] = await Promise.all([
    getDashboardStats(),
    getNotifications(),
  ]);

  return (
    <DashboardShell
      session={session}
      actionNeeded={stats.actionNeeded}
      notifications={notifications}
    >
      {children}
    </DashboardShell>
  );
}
