"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PropertyForm from "@/components/properties/property-form";
import { MoreVertical, CheckCircle } from "lucide-react";
import { approveRecord } from "@/server/actions/approval";
import { toast } from "sonner";
import { canApproveRecords } from "@/lib/permissions";
import type { UserRole } from "@prisma/client";

export type PropertyRow = {
  id: string;
  address: string;
  city: string;
  state: string;
  ownerName: string;
  verificationStatus: string;
  totalUnits: number;
  occupiedUnits: number;
  isOccupied: boolean;
};

type StatusFilter = "ALL" | "PENDING" | "APPROVED";
type OccupancyFilter = "ALL" | "VACANT" | "OCCUPIED";

export default function PropertiesTable({
  rows,
  userRole,
}: {
  rows: PropertyRow[];
  userRole?: UserRole;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [occupancyFilter, setOccupancyFilter] =
    useState<OccupancyFilter>("ALL");

  const filtered = useMemo(() => {
    let result = rows;
    const term = q.trim().toLowerCase();

    // Filter by status
    if (statusFilter !== "ALL") {
      result = result.filter((r) => r.verificationStatus === statusFilter);
    }

    // Filter by occupancy
    if (occupancyFilter !== "ALL") {
      result = result.filter((r) =>
        occupancyFilter === "OCCUPIED" ? r.isOccupied : !r.isOccupied
      );
    }

    // Sort PENDING to top for users who can approve
    if (userRole && canApproveRecords(userRole)) {
      result = [...result].sort((a, b) => {
        if (
          a.verificationStatus === "PENDING" &&
          b.verificationStatus !== "PENDING"
        )
          return -1;
        if (
          a.verificationStatus !== "PENDING" &&
          b.verificationStatus === "PENDING"
        )
          return 1;
        return 0;
      });
    }

    if (!term) return result;

    return result.filter((r) => {
      return (
        r.address.toLowerCase().includes(term) ||
        r.city.toLowerCase().includes(term) ||
        r.state.toLowerCase().includes(term) ||
        r.ownerName.toLowerCase().includes(term)
      );
    });
  }, [rows, q, userRole, statusFilter, occupancyFilter]);

  const handleApprove = async (id: string) => {
    try {
      const result = await approveRecord(id, "Property");
      if (result.success) {
        toast.success("Property approved successfully");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to approve property");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder="Search properties..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as StatusFilter)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={occupancyFilter}
          onValueChange={(val) => setOccupancyFilter(val as OccupancyFilter)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by Occupancy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Occupancy</SelectItem>
            <SelectItem value="VACANT">Vacant</SelectItem>
            <SelectItem value="OCCUPIED">Occupied</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <PropertyForm onCreated={() => router.refresh()} />
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Address</TableHead>
              <TableHead className="w-[15%]">Location</TableHead>
              <TableHead className="w-[20%]">Owner</TableHead>
              <TableHead className="w-[15%]">Status</TableHead>
              <TableHead className="w-[10%]">Occupancy</TableHead>
              <TableHead className="w-[10%] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  No properties found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="pr-6 font-semibold">
                  {r.address}
                </TableCell>
                <TableCell className="pr-6">
                  {r.city}, {r.state.replace(/_/g, " ")}
                </TableCell>
                <TableCell className="pr-6">{r.ownerName}</TableCell>
                <TableCell className="pr-6">
                  <Badge
                    variant={
                      r.verificationStatus === "APPROVED"
                        ? "default"
                        : "secondary"
                    }
                    className={
                      r.verificationStatus === "APPROVED"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-yellow-500 hover:bg-yellow-600 text-white"
                    }
                  >
                    {r.verificationStatus}
                  </Badge>
                </TableCell>
                <TableCell className="pr-6">
                  <Badge
                    variant={r.isOccupied ? "default" : "outline"}
                    className={
                      r.isOccupied
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "text-muted-foreground"
                    }
                  >
                    {r.isOccupied
                      ? `${r.occupiedUnits}/${r.totalUnits} Occupied`
                      : "Vacant"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/properties/${r.id}`}
                          className="cursor-pointer flex items-center"
                        >
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      {userRole &&
                        canApproveRecords(userRole) &&
                        r.verificationStatus === "PENDING" && (
                          <DropdownMenuItem
                            onClick={() => handleApprove(r.id)}
                            className="cursor-pointer text-green-600 focus:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
