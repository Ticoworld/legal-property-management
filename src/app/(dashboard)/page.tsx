export const dynamic = "force-dynamic";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ExpiringTable from "@/components/dashboard/expiring-table";
import { getDashboardStats } from "@/server/data/get-dashboard";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";

type WatchRow = {
  id: string;
  tenantName: string;
  expiryDate: string; // ISO string for client serialization
  propertyAddress: string;
};

export default async function DashboardHome() {
  const stats = await getDashboardStats();

  // Fetch expiring soon and expired for the watchlist (no Decimal fields selected)
  const now = new Date();
  const soon = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const tenancies = await prisma.tenancy.findMany({
    where: {
      OR: [
        { expiryDate: { lt: soon, gte: now } },
        { expiryDate: { lt: now } },
      ],
    },
    select: {
      id: true,
      tenantName: true,
      expiryDate: true,
      property: { select: { address: true } },
    },
    orderBy: { expiryDate: "asc" },
    take: 20,
  });

  const rows: WatchRow[] = tenancies.map((t) => ({
    id: t.id,
    tenantName: t.tenantName,
    expiryDate: t.expiryDate.toISOString(),
    propertyAddress: t.property.address,
  }));

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link href="/clients">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">{stats.totalClients}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/properties">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">{stats.totalProperties}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tenancies?filter=expiring">
          <Card
            className={cn(
              "cursor-pointer transition-colors hover:bg-accent",
              (stats.expiringSoon > 0) && "border-destructive"
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Action Needed</CardTitle>
              {stats.expiringSoon > 0 && (
                <Badge variant="destructive">Urgent</Badge>
              )}
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "text-3xl font-semibold tracking-tight",
                  stats.expiringSoon > 0 && "text-destructive"
                )}
              >
                {stats.expiringSoon}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Tenancies expiring &lt; 90 days</p>
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* Watchlist Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">Tenancies Expiring Soon</h2>
          {/* optional controls could go here */}
        </div>
        <ExpiringTable initialRows={rows} />
      </section>
    </div>
  );
}

