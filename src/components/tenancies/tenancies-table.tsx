"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { MoreVertical, RefreshCw, DollarSign, Eye, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import TenancyForm from "@/components/tenancies/tenancy-form";
import { PDFDownloadButton } from "@/components/documents/pdf-download-button";
import { RenewTenancyDialog } from "@/components/tenancies/renew-tenancy-dialog";
import { RecordPaymentDialog } from "@/components/tenancies/record-payment-dialog";
import { formatNaira } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type TenancyRow = {
  id: string;
  propertyAddress: string;
  tenantName: string;
  startDate: string; // ISO
  expiryDate: string; // ISO
  annualRent: string; // Decimal as string
  daysRemaining: number;
  outstandingBalance: number;
  financialStatus: 'PAID' | 'OWING' | 'OVERPAID';
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
    return { label: "Expired", variant: "destructive" as const, className: "bg-red-600 text-white font-bold" };
  }
  
  if (daysRemaining < 30) {
    return { 
      label: `${daysRemaining} Days`, 
      variant: "destructive" as const, 
      className: "bg-red-600 text-white font-bold" 
    };
  }
  
  if (daysRemaining < 90) {
    const months = Math.floor(daysRemaining / 30);
    return { 
      label: `${months} ${months === 1 ? 'Month' : 'Months'}`, 
      variant: "secondary" as const, 
      className: "bg-yellow-500 text-white" 
    };
  }
  
  // > 90 days
  const months = Math.floor(daysRemaining / 30);
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  let label = "";
  if (years > 0) {
    label = `${years} ${years === 1 ? 'Year' : 'Years'}`;
    if (remainingMonths > 0) {
      label += ` / ${remainingMonths} ${remainingMonths === 1 ? 'Month' : 'Months'}`;
    }
  } else {
    label = `${months} ${months === 1 ? 'Month' : 'Months'}`;
  }
  
  return { 
    label, 
    variant: "outline" as const, 
    className: "border-gray-400 text-gray-600" 
  };
}

type SortField = 'expiryDate' | 'balance' | null;
type SortDirection = 'asc' | 'desc';

export default function TenanciesTable({ 
  rows, 
  initialFilter 
}: { 
  rows: TenancyRow[]; 
  initialFilter?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedTenancy, setSelectedTenancy] = useState<{
    id: string;
    rent: string;
    expiry: string;
    tenantName: string;
    propertyAddress: string;
  } | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filtered = useMemo(() => {
    let filtered = rows;
    
    // Apply URL filter first (expiring status)
    if (initialFilter === "expiring") {
      const now = new Date();
      const soon = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      filtered = rows.filter((r) => {
        const expiryDate = new Date(r.expiryDate);
        return expiryDate < soon && expiryDate >= now;
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
        
        if (sortField === 'expiryDate') {
          const dateA = new Date(a.expiryDate).getTime();
          const dateB = new Date(b.expiryDate).getTime();
          comparison = dateA - dateB;
        } else if (sortField === 'balance') {
          comparison = a.outstandingBalance - b.outstandingBalance;
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    return filtered;
  }, [rows, q, initialFilter, sortField, sortDirection]);

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
          <Badge variant="secondary" className="bg-yellow-500 text-white border-transparent">
            Filtered: Expiring Soon
          </Badge>
        )}
        <div className="ml-auto">
          <TenancyForm onCreated={() => router.refresh()} />
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
                onClick={() => handleSort('expiryDate')}
              >
                <div className="flex items-center gap-1">
                  Expiry Date
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="w-[10%]">Rent</TableHead>
              <TableHead 
                className="w-[10%] cursor-pointer hover:bg-accent"
                onClick={() => handleSort('balance')}
              >
                <div className="flex items-center gap-1">
                  Balance
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="w-[10%]">Status</TableHead>
              <TableHead className="w-[8%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
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
                      className="font-medium text-blue-600 hover:underline"
                    >
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
                    {r.financialStatus === 'PAID' ? (
                      <span className="text-green-600 font-semibold">Paid</span>
                    ) : r.financialStatus === 'OVERPAID' ? (
                      <span className="text-green-600 font-semibold">
                        {formatNaira(Math.abs(r.outstandingBalance).toString())}
                      </span>
                    ) : (
                      <span className="text-red-600 font-semibold">
                        {formatNaira(r.outstandingBalance.toString())}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="">
                    <Badge
                      variant={status.variant}
                      className={cn(
                        status.label === "Active" && "bg-green-600 text-white border-transparent",
                        status.label === "Expiring Soon" && "bg-yellow-500 text-white border-transparent",
                        status.label === "Expired" && "bg-red-600 text-white border-transparent"
                      )}
                    >
                      {status.label}
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
                            <PDFDownloadButton
                              tenantName={r.tenantName}
                              propertyAddress={r.propertyAddress}
                              expiryDate={expiryDate}
                              asMenuItem={true}
                              className="flex items-center gap-2"
                            />
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
