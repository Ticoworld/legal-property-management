"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ClientForm from "@/components/clients/client-form";
import { Lock } from "lucide-react";

export type ClientRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nin: string | null;
  propertyCount: number;
};

export default function ClientsTable({ rows }: { rows: ClientRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => {
      const name = `${r.firstName} ${r.lastName}`.toLowerCase();
      return (
        name.includes(term) ||
        r.email.toLowerCase().includes(term) ||
        r.phone.toLowerCase().includes(term) ||
        (r.nin ?? "").toLowerCase().includes(term)
      );
    });
  }, [rows, q]);

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
              <TableHead className="w-[25%]">Name</TableHead>
              <TableHead className="w-[20%]">Email</TableHead>
              <TableHead className="w-[15%]">Phone</TableHead>
              <TableHead className="w-[15%]">NIN</TableHead>
              <TableHead className="w-[15%]">Assets</TableHead>
              <TableHead className="w-[10%] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No clients found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="pr-6">{r.firstName} {r.lastName}</TableCell>
                <TableCell className="pr-6">{r.email}</TableCell>
                <TableCell className="pr-6">{r.phone}</TableCell>
                <TableCell className="pr-6">
                  {r.nin ? (
                    <span className="font-mono">{r.nin}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Lock className="h-4 w-4" />
                      ****
                    </span>
                  )}
                </TableCell>
                <TableCell className="pr-6">
                  {r.propertyCount > 0 ? (
                    <Link href={`/properties?ownerId=${r.id}`}>
                      <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                        {r.propertyCount} {r.propertyCount === 1 ? "Property" : "Properties"}
                      </Badge>
                    </Link>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      No Assets
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/clients/${r.id}`}>
                    <Button size="sm" variant="outline">View</Button>
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
