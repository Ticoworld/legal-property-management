export const dynamic = "force-dynamic";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ExpiringTable from "@/components/dashboard/expiring-table";
import { getDashboardStats } from "@/server/data/get-dashboard";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/utils";
import { TrendingUp, Wrench, Building2, Clock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { canAccessDashboard, canViewFinancials } from "@/lib/permissions";

type WatchRow = {
  id: string;
  tenantName: string;
  expiryDate: string; // ISO string for client serialization
  propertyAddress: string;
  tenantPassportUrl: string | null;
};

export default async function DashboardHome() {
  const user = await getCurrentUser();

  // Dashboard access: SUPER_ADMIN and MANAGER only
  if (!canAccessDashboard(user.role)) {
    redirect("/clients");
  }

  const stats = await getDashboardStats();

  // Fetch expiring soon and expired for the watchlist (no Decimal fields selected)
  const now = new Date();
  const soon = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const tenancies = await prisma.tenancy.findMany({
    where: {
      OR: [{ expiryDate: { lt: soon, gte: now } }, { expiryDate: { lt: now } }],
    },
    select: {
      id: true,
      tenantName: true,
      expiryDate: true,
      tenantPassportUrl: true,
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
    tenantPassportUrl: t.tenantPassportUrl,
  }));

  return (
    <div className="space-y-8">
      {/* Executive KPI Cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Revenue YTD - SUPER_ADMIN Only */}
        {stats.revenueYTD !== null && canViewFinancials(user.role) && (
          <Link href="/tenancies" className="block">
            <Card className="h-full cursor-pointer transition-all hover:bg-accent hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Revenue (YTD)
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {formatNaira(stats.revenueYTD)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Total rent collected this year
                </p>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Active Issues */}
        <Link href="/maintenance" className="block">
          <Card
            className={cn(
              "h-full cursor-pointer transition-all hover:bg-accent hover:shadow-md",
              stats.activeIssues > 0 && "border-destructive/50"
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Issues
              </CardTitle>
              <div className="flex items-center gap-2">
                {stats.activeIssues > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {stats.activeIssues}
                  </Badge>
                )}
                <Wrench
                  className={cn(
                    "h-4 w-4",
                    stats.activeIssues > 0
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "text-2xl font-bold tracking-tight",
                  stats.activeIssues > 0
                    ? "text-destructive"
                    : "text-foreground"
                )}
              >
                {stats.activeIssues}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Maintenance requests pending
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Occupancy Rate */}
        <Link href="/properties" className="block">
          <Card className="h-full cursor-pointer transition-all hover:bg-accent hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Occupancy Rate
              </CardTitle>
              <Building2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold tracking-tight">
                  {stats.occupancyRate}%
                </span>
              </div>
              <Progress value={stats.occupancyRate} className="mt-2 h-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                Properties with active tenants
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Expiring Soon (30 days) */}
        <Link href="/tenancies?filter=expiring" className="block">
          <Card
            className={cn(
              "h-full cursor-pointer transition-all hover:bg-accent hover:shadow-md",
              stats.expiringSoon30 > 0 && "border-amber-500/50"
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expiring Soon
              </CardTitle>
              <div className="flex items-center gap-2">
                {stats.expiringSoon30 > 0 && (
                  <Badge
                    variant="outline"
                    className="border-amber-500 text-amber-600 text-xs"
                  >
                    Urgent
                  </Badge>
                )}
                <Clock
                  className={cn(
                    "h-4 w-4",
                    stats.expiringSoon30 > 0
                      ? "text-amber-500"
                      : "text-muted-foreground"
                  )}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "text-2xl font-bold tracking-tight",
                  stats.expiringSoon30 > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-foreground"
                )}
              >
                {stats.expiringSoon30}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Tenancies expiring in &lt; 30 days
              </p>
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* Legacy KPI Cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link href="/clients" className="block">
          <Card className="h-full cursor-pointer transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">
                {stats.totalClients}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Registered property owners
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/properties" className="block">
          <Card className="h-full cursor-pointer transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">
                {stats.totalProperties}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Properties under management
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tenancies?filter=expiring" className="block">
          <Card
            className={cn(
              "h-full cursor-pointer transition-colors hover:bg-accent",
              stats.expiringSoon > 0 && "border-destructive"
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Action Needed
              </CardTitle>
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
              <p className="mt-1 text-sm text-muted-foreground">
                Tenancies expiring &lt; 90 days
              </p>
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* Watchlist Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">
            Tenancies Expiring Soon
          </h2>
          {/* optional controls could go here */}
        </div>
        <ExpiringTable initialRows={rows} />
      </section>
    </div>
  );
}
