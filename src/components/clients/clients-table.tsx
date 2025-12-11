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

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ClientForm from "@/components/clients/client-form";
import { MoreVertical, CheckCircle, XCircle } from "lucide-react";
import { approveRecord, rejectRecord } from "@/server/actions/approval";
import { toast } from "sonner";
import { canApproveRecords } from "@/lib/permissions";
import type { UserRole } from "@prisma/client";

export type ClientRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  bvn: string | null;
  passportUrl: string | null;
  propertyCount: number;
  verificationStatus: string;
};

export default function ClientsTable({
  rows,
  userRole,
}: {
  rows: ClientRow[];
  userRole?: UserRole;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let result = rows;
    const term = q.trim().toLowerCase();

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
        return 0; // Keep original order otherwise
      });
    }

    if (!term) return result;

    return result.filter((r) => {
      const name = `${r.firstName} ${r.lastName}`.toLowerCase();
      return (
        name.includes(term) ||
        r.email.toLowerCase().includes(term) ||
        r.phone.toLowerCase().includes(term) ||
        (r.bankName ?? "").toLowerCase().includes(term) ||
        (r.accountNumber ?? "").toLowerCase().includes(term)
      );
    });
  }, [rows, q, userRole]);

  const handleApprove = async (id: string) => {
    try {
      const result = await approveRecord(id, "Client");
      if (result.success) {
        toast.success("Client approved successfully");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to approve client");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const result = await rejectRecord(id, "Client");
      if (result.success) {
        toast.success("Client rejected successfully");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to reject client");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search clients..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <div className="ml-auto">
          <ClientForm onCreated={() => router.refresh()} />
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[20%]">Name</TableHead>
              <TableHead className="w-[15%]">Email</TableHead>
              <TableHead className="w-[15%]">Phone</TableHead>
              <TableHead className="w-[15%]">Bank Account</TableHead>
              <TableHead className="w-[10%]">Status</TableHead>
              <TableHead className="w-[15%]">Assets</TableHead>
              <TableHead className="w-[10%] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No clients found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="pr-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={r.passportUrl || ""}
                        alt={r.firstName}
                      />
                      <AvatarFallback>
                        {r.firstName[0]}
                        {r.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      {r.firstName} {r.lastName}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="pr-6">{r.email}</TableCell>
                <TableCell className="pr-6">{r.phone}</TableCell>
                <TableCell className="pr-6">
                  {r.accountNumber ? (
                    <div className="text-sm">
                      <div className="font-mono">{r.accountNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.bankName}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="pr-6">
                  <Badge
                    variant={
                      r.verificationStatus === "APPROVED"
                        ? "default"
                        : r.verificationStatus === "REJECTED"
                        ? "destructive"
                        : "secondary"
                    }
                    className={
                      r.verificationStatus === "APPROVED"
                        ? "bg-green-600 hover:bg-green-700"
                        : r.verificationStatus === "REJECTED"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-yellow-500 hover:bg-yellow-600 text-white"
                    }
                  >
                    {r.verificationStatus}
                  </Badge>
                </TableCell>
                <TableCell className="pr-6">
                  {r.propertyCount > 0 ? (
                    <Link href={`/properties?ownerId=${r.id}`}>
                      <Badge
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/80"
                      >
                        {r.propertyCount}{" "}
                        {r.propertyCount === 1 ? "Property" : "Properties"}
                      </Badge>
                    </Link>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      No Assets
                    </Badge>
                  )}
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
                          href={`/clients/${r.id}`}
                          className="cursor-pointer flex items-center"
                        >
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      {userRole &&
                        canApproveRecords(userRole) &&
                        r.verificationStatus === "PENDING" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleApprove(r.id)}
                              className="cursor-pointer text-green-600 focus:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleReject(r.id)}
                              className="cursor-pointer text-red-600 focus:text-red-700"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                          </>
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
