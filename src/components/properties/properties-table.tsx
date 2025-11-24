"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PropertyForm from "@/components/properties/property-form";

export type PropertyRow = {
  id: string;
  address: string;
  city: string;
  state: string;
  titleType: string;
  ownerName: string;
};

const titleTypeLabels: Record<string, string> = {
  CERTIFICATE_OF_OCCUPANCY: "C of O",
  DEED_OF_ASSIGNMENT: "Deed",
  DEED_OF_CONVEYANCE: "Conveyance",
  GOVERNORS_CONSENT: "Gov. Consent",
  REGISTERED_CONVEYANCE: "Reg. Conveyance",
  POWER_OF_ATTORNEY: "PoA",
  OTHER: "Other",
};

const titleTypeBadgeVariants: Record<string, "default" | "secondary" | "outline"> = {
  CERTIFICATE_OF_OCCUPANCY: "default",
  DEED_OF_ASSIGNMENT: "secondary",
  DEED_OF_CONVEYANCE: "secondary",
  GOVERNORS_CONSENT: "default",
  REGISTERED_CONVEYANCE: "secondary",
  POWER_OF_ATTORNEY: "outline",
  OTHER: "outline",
};

export default function PropertiesTable({ rows }: { rows: PropertyRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => {
      return (
        r.address.toLowerCase().includes(term) ||
        r.city.toLowerCase().includes(term) ||
        r.state.toLowerCase().includes(term) ||
        r.ownerName.toLowerCase().includes(term)
      );
    });
  }, [rows, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search properties..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <div className="ml-auto">
          <PropertyForm onCreated={() => router.refresh()} />
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[35%]">Address</TableHead>
              <TableHead className="w-[20%]">Location</TableHead>
              <TableHead className="w-[20%]">Owner</TableHead>
              <TableHead className="w-[15%]">Title Type</TableHead>
              <TableHead className="w-[10%] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No properties found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="pr-6 font-semibold">{r.address}</TableCell>
                <TableCell className="pr-6">
                  {r.city}, {r.state.replace(/_/g, " ")}
                </TableCell>
                <TableCell className="pr-6">{r.ownerName}</TableCell>
                <TableCell className="pr-6">
                  <Badge variant={titleTypeBadgeVariants[r.titleType] || "outline"}>
                    {titleTypeLabels[r.titleType] || r.titleType}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                    <Link href={`/properties/${r.id}`}>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
