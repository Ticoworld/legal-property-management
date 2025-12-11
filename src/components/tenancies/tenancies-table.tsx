"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  MoreVertical,
  RefreshCw,
  DollarSign,
  Eye,
  ArrowUpDown,
  CheckCircle,
} from "lucide-react";
import { approveRecord } from "@/server/actions/approval";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import TenancyForm from "@/components/tenancies/tenancy-form";
import { PDFDownloadButton } from "@/components/documents/pdf-download-button";
import { RenewTenancyDialog } from "@/components/tenancies/renew-tenancy-dialog";
import { RecordPaymentDialog } from "@/components/tenancies/record-payment-dialog";
import { formatNaira } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { canApproveRecords, canCreateRecords } from "@/lib/permissions";
import { getFirmSettings, type FirmSettings } from "@/server/actions/settings";
import type { UserRole } from "@prisma/client";

export type TenancyRow = {
  id: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  landlordFirstName: string;
  landlordLastName: string;
  unitName?: string;
  unitType?: string;
  paymentFrequency: string;
  tenantName: string;
  startDate: string; // ISO
  expiryDate: string; // ISO
  annualRent: string; // Decimal as string
  daysRemaining: number;
  outstandingBalance: number;
  totalExpenses: number;
  financialStatus: "PAID" | "OWING" | "OVERPAID";
  tenantPassportUrl: string | null;
  verificationStatus: string;
};

function getStatus(expiryDate: Date) {
  const now = new Date();
  const soon = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  if (expiryDate < now) {
    return { label: "Expired", variant: "destructive" as const };
  }
  if (expiryDate < soon) {
    return { label: "Expiring Soon", variant: "secondary" as const };
  }
  return { label: "Active", variant: "default" as const };
}

function getTimeLeftBadge(daysRemaining: number) {
  if (daysRemaining <= 0) {
    return {
      label: "Expired",
      variant: "destructive" as const,
      className: "bg-red-600 text-white font-bold",
    };
  }

  if (daysRemaining < 30) {
    return {
      label: `${daysRemaining} Days`,
      variant: "destructive" as const,
      className: "bg-red-600 text-white font-bold",
    };
  }

  if (daysRemaining < 90) {
    const months = Math.floor(daysRemaining / 30);
    return {
      label: `${months} ${months === 1 ? "Month" : "Months"}`,
      variant: "secondary" as const,
      className: "bg-yellow-500 text-white",
    };
  }

  // > 90 days
  const months = Math.floor(daysRemaining / 30);
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  let label = "";
  if (years > 0) {
    label = `${years} ${years === 1 ? "Year" : "Years"}`;
    if (remainingMonths > 0) {
      label += ` / ${remainingMonths} ${
        remainingMonths === 1 ? "Month" : "Months"
      }`;
    }
  } else {
    label = `${months} ${months === 1 ? "Month" : "Months"}`;
  }

  return {
    label,
    variant: "outline" as const,
    className: "border-gray-400 text-gray-600",
  };
}

type SortField = "expiryDate" | "balance" | null;
type SortDirection = "asc" | "desc";
type StatusFilter = "ALL" | "ACTIVE" | "EXPIRING_SOON" | "EXPIRED";
type FinancialFilter = "ALL" | "OWING" | "PAID";

export default function TenanciesTable({
  rows,
  initialFilter,
  userRole,
}: {
  rows: TenancyRow[];
  initialFilter?: string;
  userRole: UserRole;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [financialFilter, setFinancialFilter] =
    useState<FinancialFilter>("ALL");
  const [selectedTenancy, setSelectedTenancy] = useState<{
    id: string;
    rent: string;
    expiry: string;
    tenantName: string;
    propertyAddress: string;
  } | null>(null);

  const canCreate = canCreateRecords(userRole);
  const [firmSettings, setFirmSettings] = useState<FirmSettings | null>(null);

  useEffect(() => {
    getFirmSettings().then(setFirmSettings);
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const result = await approveRecord(id, "Tenancy");
      if (result.success) {
        toast.success("Tenancy approved successfully");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      toast.error("Failed to approve tenancy");
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filtered = useMemo(() => {
    let filtered = rows;

    // Maker-Checker: Sort PENDING to top for users who can approve
    if (canApproveRecords(userRole)) {
      filtered = [...filtered].sort((a, b) => {
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

    // Apply URL filter first (expiring status)
    if (initialFilter === "expiring") {
      const now = new Date();
      const soon = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      filtered = rows.filter((r) => {
        const expiryDate = new Date(r.expiryDate);
        return expiryDate < soon && expiryDate >= now;
      });
    }

    // Apply status filter
    if (statusFilter !== "ALL") {
      const now = new Date();
      const soon = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((r) => {
        const expiryDate = new Date(r.expiryDate);
        if (statusFilter === "EXPIRED") return expiryDate < now;
        if (statusFilter === "EXPIRING_SOON")
          return expiryDate >= now && expiryDate < soon;
        if (statusFilter === "ACTIVE") return expiryDate >= soon;
        return true;
      });
    }

    // Apply financial filter
    if (financialFilter !== "ALL") {
      filtered = filtered.filter((r) => {
        if (financialFilter === "OWING") return r.financialStatus === "OWING";
        if (financialFilter === "PAID")
          return (
            r.financialStatus === "PAID" || r.financialStatus === "OVERPAID"
          );
        return true;
      });
    }

    // Then apply search term
    const term = q.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter((r) => {
        return (
          r.propertyAddress.toLowerCase().includes(term) ||
          r.tenantName.toLowerCase().includes(term)
        );
      });
    }

    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;

        if (sortField === "expiryDate") {
          const dateA = new Date(a.expiryDate).getTime();
          const dateB = new Date(b.expiryDate).getTime();
          comparison = dateA - dateB;
        } else if (sortField === "balance") {
          comparison = a.outstandingBalance - b.outstandingBalance;
        }

        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [
    rows,
    q,
    initialFilter,
    sortField,
    sortDirection,
    userRole,
    statusFilter,
    financialFilter,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search tenancies..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        {initialFilter === "expiring" && (
          <Badge
            variant="secondary"
            className="bg-yellow-500 text-white border-transparent"
          >
            Filtered: Expiring Soon
          </Badge>
        )}
        <Select
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as StatusFilter)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="EXPIRING_SOON">Expiring Soon</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={financialFilter}
          onValueChange={(val) => setFinancialFilter(val as FinancialFilter)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Financial" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Financial</SelectItem>
            <SelectItem value="OWING">In Arrears</SelectItem>
            <SelectItem value="PAID">Fully Paid</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto">
          {canCreate && (
            <Suspense
              fallback={
                <Button disabled size="sm">
                  Loading...
                </Button>
              }
            >
              <TenancyForm onCreated={() => router.refresh()} />
            </Suspense>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[20%]">Property</TableHead>
              <TableHead className="w-[15%]">Tenant</TableHead>
              <TableHead className="w-[12%]">Time Left</TableHead>
              <TableHead
                className="w-[15%] cursor-pointer hover:bg-accent"
                onClick={() => handleSort("expiryDate")}
              >
                <div className="flex items-center gap-1">
                  Expiry Date
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="w-[10%]">Rent</TableHead>
              <TableHead
                className="w-[10%] cursor-pointer hover:bg-accent"
                onClick={() => handleSort("balance")}
              >
                <div className="flex items-center gap-1">
                  Balance
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="w-[10%]">Status</TableHead>
              <TableHead className="w-[8%]">Review</TableHead>
              <TableHead className="w-[8%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-muted-foreground"
                >
                  No tenancies found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r) => {
              const expiryDate = new Date(r.expiryDate);
              const status = getStatus(expiryDate);
              const timeLeftBadge = getTimeLeftBadge(r.daysRemaining);

              return (
                <TableRow key={r.id}>
                  <TableCell className="pr-6">
                    <Link
                      href={`/tenancies/${r.id}`}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      {r.propertyAddress}
                    </Link>
                  </TableCell>
                  <TableCell className="pr-6">
                    <Link
                      href={`/tenancies/${r.id}`}
                      className="font-medium text-blue-600 hover:underline flex items-center gap-3"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={r.tenantPassportUrl || ""}
                          alt={r.tenantName}
                        />
                        <AvatarFallback>{r.tenantName[0]}</AvatarFallback>
                      </Avatar>
                      {r.tenantName}
                    </Link>
                  </TableCell>
                  <TableCell className="pr-6">
                    <Badge
                      variant={timeLeftBadge.variant}
                      className={cn(timeLeftBadge.className)}
                    >
                      {timeLeftBadge.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-sm">
                    {format(expiryDate, "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="pr-6 font-mono">
                    {formatNaira(r.annualRent)}
                  </TableCell>
                  <TableCell className="pr-6 font-mono">
                    {r.financialStatus === "PAID" ? (
                      <span className="text-green-600 font-semibold">Paid</span>
                    ) : r.financialStatus === "OVERPAID" ? (
                      <span className="text-green-600 font-semibold">
                        {formatNaira(Math.abs(r.outstandingBalance).toString())}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-red-600 font-semibold">
                          {formatNaira(r.outstandingBalance.toString())}
                        </span>
                        <Badge className="bg-red-600 text-white text-xs">
                          Arrears
                        </Badge>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="pr-6 font-mono text-red-600">
                    {formatNaira((r.totalExpenses ?? 0).toString())}
                  </TableCell>
                  <TableCell className="">
                    <Badge
                      variant={status.variant}
                      className={cn(
                        status.label === "Active" &&
                          "bg-green-600 text-white border-transparent",
                        status.label === "Expiring Soon" &&
                          "bg-yellow-500 text-white border-transparent",
                        status.label === "Expired" &&
                          "bg-red-600 text-white border-transparent"
                      )}
                    >
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
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
                            href={`/tenancies/${r.id}`}
                            className="cursor-pointer flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {canApproveRecords(userRole) &&
                          r.verificationStatus === "PENDING" && (
                            <DropdownMenuItem
                              onClick={() => handleApprove(r.id)}
                              className="cursor-pointer text-green-600 focus:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                          )}
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTenancy({
                              id: r.id,
                              rent: r.annualRent,
                              expiry: r.expiryDate,
                              tenantName: r.tenantName,
                              propertyAddress: r.propertyAddress,
                            });
                            setPaymentDialogOpen(true);
                          }}
                          className="cursor-pointer"
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Record Payment
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTenancy({
                              id: r.id,
                              rent: r.annualRent,
                              expiry: r.expiryDate,
                              tenantName: r.tenantName,
                              propertyAddress: r.propertyAddress,
                            });
                            setRenewDialogOpen(true);
                          }}
                          className="cursor-pointer"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Renew Lease
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <div className="w-full cursor-pointer">
                            {firmSettings && (
                              <PDFDownloadButton
                                tenancy={{
                                  id: r.id,
                                  tenantName: r.tenantName,
                                  paymentFrequency: r.paymentFrequency,
                                  expiryDate: expiryDate,
                                }}
                                property={{
                                  address: r.propertyAddress,
                                  city: r.propertyCity,
                                  state: r.propertyState,
                                }}
                                unit={
                                  r.unitName
                                    ? {
                                        name: r.unitName,
                                        type: r.unitType || "",
                                      }
                                    : null
                                }
                                landlord={{
                                  firstName: r.landlordFirstName,
                                  lastName: r.landlordLastName,
                                }}
                                solicitor={{ name: null }}
                                settings={firmSettings}
                                asMenuItem={true}
                                className="flex items-center gap-2"
                              />
                            )}
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selectedTenancy && (
        <>
          <RenewTenancyDialog
            open={renewDialogOpen}
            onOpenChange={setRenewDialogOpen}
            tenancyId={selectedTenancy.id}
            currentRent={selectedTenancy.rent}
            currentExpiry={selectedTenancy.expiry}
          />
          <RecordPaymentDialog
            open={paymentDialogOpen}
            onOpenChange={setPaymentDialogOpen}
            tenancyId={selectedTenancy.id}
            tenantName={selectedTenancy.tenantName}
            propertyAddress={selectedTenancy.propertyAddress}
            onSuccess={() => router.refresh()}
          />
        </>
      )}
    </div>
  );
}
