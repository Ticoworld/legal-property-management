import { getProperties } from "@/server/data/get-properties";
import { getClient } from "@/server/data/get-client";
import { getCurrentUser } from "@/lib/auth-helper";
import PropertiesTable, {
  type PropertyRow,
} from "@/components/properties/properties-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ ownerId?: string }>;
};

export default async function PropertiesPage({ searchParams }: PageProps) {
  const currentUser = await getCurrentUser();
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
    ownerName: `${p.owner.firstName} ${p.owner.lastName}`,
    verificationStatus: p.verificationStatus,
    totalUnits: p.totalUnits,
    occupiedUnits: p.occupiedUnits,
    isOccupied: p.isOccupied,
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

      <PropertiesTable rows={rows} userRole={currentUser.role} />
    </div>
  );
}
