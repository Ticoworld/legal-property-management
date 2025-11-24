import { getProperties } from "@/server/data/get-properties";
import { getClient } from "@/server/data/get-client";
import PropertiesTable, { type PropertyRow } from "@/components/properties/properties-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ ownerId?: string }>;
};

export default async function PropertiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ownerId = params.ownerId;
  
  const data = await getProperties(ownerId);
  
  // If filtering by owner, get owner name
  let ownerName: string | null = null;
  if (ownerId) {
    const owner = await getClient(ownerId);
    if (owner) {
      ownerName = `${owner.firstName} ${owner.lastName}`;
    }
  }

  const rows: PropertyRow[] = data.map((p) => ({
    id: p.id,
    address: p.address,
    city: p.city,
    state: p.state,
    titleType: p.titleType,
    ownerName: `${p.owner.firstName} ${p.owner.lastName}`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Properties</h1>
      </div>

      {/* Active Filter Badge */}
      {ownerId && ownerName && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-2">
            Filtered by Owner: {ownerName}
          </Badge>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/properties">
              <X className="h-4 w-4 mr-1" />
              Clear Filter
            </Link>
          </Button>
        </div>
      )}

      <PropertiesTable rows={rows} />
    </div>
  );
}
