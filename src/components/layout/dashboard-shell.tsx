"use client";

import Link from "next/link";
import { Fragment } from "react";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import {
  LayoutDashboard,
  Users,
  Building2,
  ScrollText,
  Settings as SettingsIcon,
  Wrench,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { UserNav } from "@/components/layout/user-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import { CommandMenu } from "@/components/layout/command-menu";
import type { Notification } from "@/server/data/get-notifications";
import type { LucideIcon } from "lucide-react";
import { canManageTeam } from "@/lib/permissions";
import type { UserRole } from "@prisma/client";

type DashboardShellProps = {
  children: React.ReactNode;
  session: Session | null;
  actionNeeded: number;
  notifications: Notification[];
};

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  critical?: boolean;
};

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Properties", href: "/properties", icon: Building2 },
  { name: "Maintenance", href: "/maintenance", icon: Wrench },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  // Highlight this as critical
  {
    name: "Tenancy Tracking",
    href: "/tenancies",
    icon: ScrollText,
    critical: true,
  },
  { name: "Settings", href: "/settings", icon: SettingsIcon },
];

function BreadcrumbTrail() {
  const pathname = usePathname();
  const segments = (pathname || "/").split("/").filter(Boolean);

  const crumbs = [
    { label: "Home", href: "/" },
    ...segments.map((seg, idx) => {
      const href = "/" + segments.slice(0, idx + 1).join("/");
      const label = seg
        .replaceAll("-", " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return { label, href };
    }),
  ];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <Fragment key={c.href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{c.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={c.href}>{c.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default function DashboardShell({
  children,
  session,
  actionNeeded,
  notifications,
}: DashboardShellProps) {
  const pathname = usePathname();
  const role = (session?.user as { role?: string })?.role;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 w-64 border-r bg-card">
        <div className="flex h-16 items-center px-5 border-b">
          <span className="text-lg font-semibold tracking-tight">
            Ogodo & Co.
          </span>
        </div>
        <nav className="p-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              // Hide Settings for non-SUPER_ADMIN/MANAGER users
              const userRole = role as UserRole | undefined;
              if (
                item.name === "Settings" &&
                (!userRole || !canManageTeam(userRole))
              ) {
                return null;
              }
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors border border-transparent",
                      "hover:bg-accent hover:border-border",
                      active && "bg-accent border-border",
                      item.critical && "justify-between"
                    )}
                  >
                    <span className="inline-flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span
                        className={cn(
                          "font-medium",
                          item.critical &&
                            actionNeeded > 0 &&
                            "text-red-500 dark:text-red-400"
                        )}
                      >
                        {item.name}
                      </span>
                    </span>
                    {item.critical && actionNeeded > 0 && (
                      <Badge
                        variant="destructive"
                        className="ml-auto bg-red-600 dark:bg-red-500 border-red-600 dark:border-red-500"
                      >
                        Critical
                      </Badge>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Top header */}
      <header className="fixed left-64 right-0 top-0 z-20 h-16 border-b bg-card">
        <div className="flex h-full items-center justify-between px-6">
          <BreadcrumbTrail />
          <div className="flex items-center gap-3">
            <CommandMenu />
            <NotificationBell initialNotifications={notifications} />
            {session?.user && <UserNav user={session.user} />}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pl-64 pt-16">
        <div className="mx-auto max-w-7xl p-6">{children}</div>
      </main>
    </div>
  );
}
