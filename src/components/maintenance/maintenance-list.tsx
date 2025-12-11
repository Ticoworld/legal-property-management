"use client";

import { useTransition, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  MoreHorizontal,
  Wrench,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateMaintenanceStatus } from "@/server/actions/maintenance";
import { toast } from "sonner";
import type { MaintenanceStatus, MaintenancePriority } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MaintenanceRequest = {
  id: string;
  title: string;
  description: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  createdAt: Date | string;
  propertyId: string;
  unitId?: string | null;
  tenancyId?: string | null;
};

type MaintenanceListProps = {
  requests: MaintenanceRequest[];
  showActions?: boolean;
  emptyMessage?: string;
};

type SortOrder = "URGENT_FIRST" | "NEWEST_FIRST";
type StatusFilterType = "ALL" | "OPEN" | "RESOLVED";

// Priority badge styling
function getPriorityBadge(priority: MaintenancePriority) {
  switch (priority) {
    case "URGENT":
      return {
        className: "bg-red-500 text-white border-transparent",
        label: "Urgent",
      };
    case "HIGH":
      return {
        className: "bg-yellow-500 text-white border-transparent",
        label: "High",
      };
    case "MEDIUM":
      return {
        className: "bg-blue-500 text-white border-transparent",
        label: "Medium",
      };
    case "LOW":
      return {
        className: "bg-slate-400 text-white border-transparent",
        label: "Low",
      };
    default:
      return { className: "", label: priority };
  }
}

// Status badge styling
function getStatusBadge(status: MaintenanceStatus) {
  switch (status) {
    case "OPEN":
      return {
        className: "bg-orange-100 text-orange-700 border-orange-200",
        label: "Open",
        icon: Clock,
      };
    case "IN_PROGRESS":
      return {
        className: "bg-blue-100 text-blue-700 border-blue-200",
        label: "In Progress",
        icon: Wrench,
      };
    case "RESOLVED":
      return {
        className: "bg-green-100 text-green-700 border-green-200",
        label: "Resolved",
        icon: CheckCircle2,
      };
    case "CLOSED":
      return {
        className: "bg-slate-100 text-slate-700 border-slate-200",
        label: "Closed",
        icon: XCircle,
      };
    default:
      return { className: "", label: status, icon: Clock };
  }
}

function StatusUpdateMenu({
  request,
  onUpdate,
}: {
  request: MaintenanceRequest;
  onUpdate: (id: string, status: MaintenanceStatus) => void;
}) {
  const statuses: { value: MaintenanceStatus; label: string }[] = [
    { value: "OPEN", label: "Open" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "RESOLVED", label: "Resolved" },
    { value: "CLOSED", label: "Closed" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Update Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {statuses.map((s) => (
          <DropdownMenuItem
            key={s.value}
            onClick={() => onUpdate(request.id, s.value)}
            disabled={request.status === s.value}
            className={cn(
              request.status === s.value && "font-semibold bg-muted"
            )}
          >
            {s.label}
            {request.status === s.value && " (current)"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MaintenanceList({
  requests,
  showActions = true,
  emptyMessage = "No maintenance requests recorded yet.",
}: MaintenanceListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sortOrder, setSortOrder] = useState<SortOrder>("URGENT_FIRST");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("ALL");

  const handleStatusUpdate = (id: string, newStatus: MaintenanceStatus) => {
    startTransition(async () => {
      const result = await updateMaintenanceStatus(id, newStatus);

      if (result.success) {
        toast.success("Status updated", {
          description: result.message,
        });
        router.refresh();
      } else {
        toast.error("Failed to update status", {
          description: result.message,
        });
      }
    });
  };

  // Filter and sort requests
  const filteredRequests = useMemo(() => {
    let result = [...requests];

    // Apply status filter
    if (statusFilter !== "ALL") {
      result = result.filter((r) => {
        if (statusFilter === "OPEN")
          return r.status === "OPEN" || r.status === "IN_PROGRESS";
        if (statusFilter === "RESOLVED")
          return r.status === "RESOLVED" || r.status === "CLOSED";
        return true;
      });
    }

    // Apply sort
    if (sortOrder === "URGENT_FIRST") {
      const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      result.sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      );
    } else {
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [requests, sortOrder, statusFilter]);

  if (filteredRequests.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Select
            value={sortOrder}
            onValueChange={(val) => setSortOrder(val as SortOrder)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="URGENT_FIRST">Urgent First</SelectItem>
              <SelectItem value="NEWEST_FIRST">Newest First</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as StatusFilterType)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select
          value={sortOrder}
          onValueChange={(val) => setSortOrder(val as SortOrder)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="URGENT_FIRST">Urgent First</SelectItem>
            <SelectItem value="NEWEST_FIRST">Newest First</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as StatusFilterType)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div
        className={cn(
          "space-y-3",
          isPending && "opacity-50 pointer-events-none"
        )}
      >
        {filteredRequests.map((request) => {
          const priorityBadge = getPriorityBadge(request.priority);
          const statusBadge = getStatusBadge(request.status);
          const StatusIcon = statusBadge.icon;

          return (
            <Card
              key={request.id}
              className="hover:shadow-sm transition-shadow"
            >
              <CardHeader className="py-3 px-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-base font-medium truncate">
                      {request.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {format(
                        new Date(request.createdAt),
                        "MMM dd, yyyy 'at' h:mm a"
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={priorityBadge.className}>
                      {priorityBadge.label}
                    </Badge>
                    <Badge variant="outline" className={statusBadge.className}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusBadge.label}
                    </Badge>
                    {showActions && (
                      <StatusUpdateMenu
                        request={request}
                        onUpdate={handleStatusUpdate}
                      />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-2 px-4 border-t bg-muted/30">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {request.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
