export const dynamic = 'force-dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTeamMembers } from "@/server/data/get-team";
import { TeamManager } from "@/components/settings/team-manager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { getAuditLogs } from "@/server/data/get-audit-logs";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

export default async function SettingsPage() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    redirect('/');
  }
  const [auditLogs, team] = await Promise.all([
    getAuditLogs(),
    getTeamMembers(),
  ]);

  const getActionBadgeVariant = (action: string) => {
    if (action.startsWith("CREATE")) return "default";
    if (action.startsWith("UPDATE")) return "secondary";
    if (action.startsWith("DELETE")) return "destructive";
    return "outline";
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case "Client":
        return "👤";
      case "Property":
        return "🏢";
      case "Tenancy":
        return "📋";
      default:
        return "📄";
    }
  };

  const formatDetails = (details: unknown) => {
    if (!details) return "—";
    
    // If it's a simple object, show key changes
    if (typeof details === "object" && details !== null) {
      const keys = Object.keys(details as Record<string, unknown>);
      if (keys.length === 0) return "—";
      
      // Show first few keys
      const summary = keys.slice(0, 2).join(", ");
      return keys.length > 2 ? `${summary}, +${keys.length - 2} more` : summary;
    }
    
    return String(details).slice(0, 50) + (String(details).length > 50 ? "..." : "");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application preferences and view system activity.
        </p>
      </div>
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the visual theme of your application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Theme</label>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred theme or sync with system settings.
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team</CardTitle>
              <CardDescription>Manage your staff members and access roles.</CardDescription>
            </CardHeader>
            <CardContent>
              <TeamManager members={team} isAdmin={session?.user?.role === 'ADMIN'} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Security & Compliance</CardTitle>
              <CardDescription>
                System Activity Log - Last 50 operations recorded for audit compliance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead className="w-[140px]">Entity ID</TableHead>
                      <TableHead>Performed By</TableHead>
                      <TableHead className="w-[120px]">Time</TableHead>
                      <TableHead className="w-[180px]">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          <p className="text-muted-foreground">No audit logs recorded yet.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge variant={getActionBadgeVariant(log.action)}>{log.action}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{getEntityIcon(log.entityType)}</span>
                              <span className="font-medium">{log.entityType}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="rounded bg-muted px-2 py-1 text-xs font-mono">{log.entityId.slice(0, 8)}...</code>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium">{log.user?.name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{log.user?.email || "—"}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{formatDetails(log.details)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
