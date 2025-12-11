export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { MaintenanceList } from "@/components/maintenance/maintenance-list";
import { Wrench } from "lucide-react";

export default async function MaintenancePage() {
  // Fetch all maintenance requests (not closed first, then closed)
  const requests = await prisma.maintenanceRequest.findMany({
    orderBy: [
      { status: "asc" }, // OPEN, IN_PROGRESS first
      { priority: "asc" }, // URGENT first (enum order)
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      createdAt: true,
      propertyId: true,
      unitId: true,
      tenancyId: true,
    },
  });

  // Count active issues (not closed)
  const activeCount = requests.filter((r) => r.status !== "CLOSED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wrench className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Maintenance Requests
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeCount > 0
                ? `${activeCount} active issue${
                    activeCount !== 1 ? "s" : ""
                  } requiring attention`
                : "All issues resolved"}
            </p>
          </div>
        </div>
      </div>

      {/* Maintenance List */}
      <MaintenanceList requests={requests} />
    </div>
  );
}
