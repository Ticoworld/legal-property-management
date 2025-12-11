"use client";

import { useMemo, useState } from "react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type WatchRow = {
  id: string;
  tenantName: string;
  expiryDate: string; // ISO string
  propertyAddress: string;
  tenantPassportUrl: string | null;
};

function statusFor(expiry: Date) {
  const now = new Date();
  const soon = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  if (expiry < now) return { label: "Expired", color: "destructive" as const };
  if (expiry < soon) return { label: "Expiring", color: "secondary" as const };
  return { label: "Active", color: "default" as const };
}

export default function ExpiringTable({
  initialRows,
}: {
  initialRows: WatchRow[];
}) {
  const [asc, setAsc] = useState(true);

  const sorted = useMemo(() => {
    return [...initialRows].sort((a, b) => {
      const da = new Date(a.expiryDate).getTime();
      const db = new Date(b.expiryDate).getTime();
      return asc ? da - db : db - da;
    });
  }, [initialRows, asc]);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Property Address</TableHead>
            <TableHead className="w-[25%]">Tenant Name</TableHead>
            <TableHead className="w-[20%]">
              <button
                type="button"
                onClick={() => setAsc((v) => !v)}
                className="inline-flex items-center gap-1 text-foreground hover:text-primary"
              >
                Expiry Date{" "}
                {asc ? (
                  <ArrowUpNarrowWide className="h-4 w-4" />
                ) : (
                  <ArrowDownWideNarrow className="h-4 w-4" />
                )}
              </button>
            </TableHead>
            <TableHead className="w-[15%] text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground"
              >
                No upcoming expiries.
              </TableCell>
            </TableRow>
          )}
          {sorted.map((r) => {
            const d = new Date(r.expiryDate);
            const s = statusFor(d);
            return (
              <TableRow key={r.id}>
                <TableCell className="pr-6">{r.propertyAddress}</TableCell>
                <TableCell className="pr-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={r.tenantPassportUrl || ""}
                        alt={r.tenantName}
                      />
                      <AvatarFallback>{r.tenantName[0]}</AvatarFallback>
                    </Avatar>
                    <span>{r.tenantName}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono pr-6">
                  {d.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={s.color}
                    className={cn(
                      s.label === "Active" &&
                        "bg-green-600 text-white border-transparent",
                      s.label === "Expiring" &&
                        "bg-yellow-500 text-white border-transparent",
                      s.label === "Expired" &&
                        "bg-red-600 text-white border-transparent"
                    )}
                  >
                    {s.label}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
