import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  MapPin,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  Building,
  Key,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { auth } from "@/auth";
import { getProperty } from "@/server/data/get-property";
import { DeletePropertyDialog } from "@/components/properties/delete-property-dialog";
import { MaintenanceList } from "@/components/maintenance/maintenance-list";
import { CreateTicketDialog } from "@/components/maintenance/create-ticket-dialog";
import { EditPropertyButton } from "@/components/properties/edit-property-button";
import { canDeleteAssets } from "@/lib/permissions";
import type { UserRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { format, differenceInDays } from "date-fns";

type PageProps = {
  params: Promise<{ id: string }>;
};

type Tenancy = {
  id: string;
  tenantName: string;
  startDate: Date;
  expiryDate: Date;
};

function getPropertyStatus(tenancies: Tenancy[]): "OCCUPIED" | "VACANT" {
  // Check if there's an active tenancy
  const now = new Date();
  const activeTenancy = tenancies.find(
    (t) => new Date(t.startDate) <= now && new Date(t.expiryDate) >= now
  );
  return activeTenancy ? "OCCUPIED" : "VACANT";
}

function getTenancyStatus(
  startDate: Date,
  expiryDate: Date
): "ACTIVE" | "EXPIRED" {
  const now = new Date();
  if (new Date(startDate) <= now && new Date(expiryDate) >= now) {
    return "ACTIVE";
  }
  return "EXPIRED";
}

function getTenancyDuration(startDate: Date, expiryDate: Date): string {
  const start = new Date(startDate);
  const end = new Date(expiryDate);
  const days = differenceInDays(end, start);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (years > 0) {
    const remainingMonths = months % 12;
    return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years}y`;
  }
  if (months > 0) {
    return `${months}m`;
  }
  return `${days}d`;
}

function formatUnitType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export default async function PropertyProfilePage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const property = await getProperty(id);

  if (!property) {
    notFound();
  }

  const userRole = session?.user?.role as UserRole | undefined;
  const showDangerZone = userRole && canDeleteAssets(userRole);

  const status = getPropertyStatus(property.tenancies);
  const ownerName = `${property.owner.firstName} ${property.owner.lastName}`;

  const totalUnits = property.units?.length || 0;
  const occupiedUnits =
    property.units?.filter((u) => u.tenancies.length > 0).length || 0;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" className="gap-2" asChild>
        <Link href="/properties">
          <ArrowLeft className="h-4 w-4" />
          Back to Properties
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {property.address}
          </h1>
          <div className="flex items-center gap-2">
            <Badge
              variant={status === "OCCUPIED" ? "default" : "secondary"}
              className="gap-1"
            >
              {status === "OCCUPIED" ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              {status}
            </Badge>
          </div>
        </div>
        <EditPropertyButton
          property={{
            id: property.id,
            address: property.address,
            city: property.city,
            state: property.state,
            titleType: property.titleType,
            registrationNumber: property.registrationNumber,
            surveyNumber: property.surveyNumber,
            plotNumber: property.plotNumber,
            structureType: property.structureType,
            ownerId: property.ownerId,
          }}
        />
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Section A: Asset Details */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Details</CardTitle>
            <CardDescription>
              Property registration and location information
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {/* Title Type */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 rounded-md bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-muted-foreground">
                  Title Type
                </p>
                <p className="text-sm">{property.titleType}</p>
              </div>
            </div>

            {/* Registration Number */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 rounded-md bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-muted-foreground">
                  Registration Number
                </p>
                <p className="text-sm font-mono">
                  {property.registrationNumber || "—"}
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 rounded-md bg-primary/10">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-muted-foreground">
                  Location
                </p>
                <p className="text-sm">
                  {property.city}, {property.state}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section B: Ownership */}
        <Card>
          <CardHeader>
            <CardTitle>Ownership</CardTitle>
            <CardDescription>
              Current registered owner of this property
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 rounded-md bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-muted-foreground">
                  Owner
                </p>
                <Link href={`/clients/${property.owner.id}`}>
                  <p className="text-sm font-medium text-primary hover:underline">
                    {ownerName}
                  </p>
                </Link>
                <p className="text-xs text-muted-foreground">
                  {property.owner.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section: Unit Inventory (Only for multi-unit properties) */}
      {property.units && property.units.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle>Unit Inventory</CardTitle>
              <CardDescription>Manage units and occupancy</CardDescription>
            </div>
            <Badge variant="outline" className="ml-auto">
              {occupiedUnits}/{totalUnits} Units Occupied
            </Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {property.units.map((unit) => {
                  const activeTenancy = unit.tenancies[0]; // We only fetch active ones
                  const isOccupied = !!activeTenancy;

                  return (
                    <TableRow key={unit.id} className="even:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {unit.name}
                        </div>
                      </TableCell>
                      <TableCell>{formatUnitType(unit.type)}</TableCell>
                      <TableCell>
                        {isOccupied ? (
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant="default"
                              className="bg-blue-600 hover:bg-blue-700 w-fit"
                            >
                              Occupied
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {activeTenancy.tenantName}
                            </span>
                          </div>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-green-600 border-green-600 bg-green-50"
                          >
                            Vacant
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isOccupied ? (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/tenancies/${activeTenancy.id}`}>
                              View Lease
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            asChild
                          >
                            <Link
                              href={`/tenancies?propertyId=${property.id}&unitId=${unit.id}`}
                            >
                              <Key className="h-3 w-3" />
                              Assign Tenant
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Section C: Tenancy History */}
      <Card>
        <CardHeader>
          <CardTitle>Tenancy History</CardTitle>
          <CardDescription>
            Past and present lease agreements for this property
          </CardDescription>
        </CardHeader>
        <CardContent>
          {property.tenancies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm font-medium text-muted-foreground">
                No Tenancy Records
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This property has no tenancy history.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {property.tenancies.map((tenancy) => {
                  const status = getTenancyStatus(
                    tenancy.startDate,
                    tenancy.expiryDate
                  );
                  const duration = getTenancyDuration(
                    tenancy.startDate,
                    tenancy.expiryDate
                  );

                  return (
                    <TableRow key={tenancy.id}>
                      <TableCell className="font-medium">
                        {tenancy.tenantName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(tenancy.startDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(tenancy.expiryDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {duration}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            status === "ACTIVE" ? "default" : "secondary"
                          }
                        >
                          {status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Section D: Title Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Title Documents</CardTitle>
          <CardDescription>
            Uploaded documents for this property
          </CardDescription>
        </CardHeader>
        <CardContent>
          {property.documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm font-medium text-muted-foreground">
                No Documents
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                No documents have been uploaded for this property yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {property.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">
                        {doc.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded{" "}
                        {format(new Date(doc.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2">
                    View
                  </Button>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section E: Data Privacy & Control (SUPER_ADMIN ONLY) */}
      {showDangerZone && (
        <Card className="border-destructive/50" data-testid="danger-zone">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">
                Data Privacy & Control
              </CardTitle>
            </div>
            <CardDescription>
              Administrative actions for this property. Admin access only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Warning Banner */}
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-destructive">
                    Danger Zone
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    These actions are permanent and cannot be undone. Deletion
                    is blocked if the property has active tenancies. All actions
                    are logged for compliance.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <DeletePropertyDialog
                propertyId={property.id}
                propertyAddress={property.address}
              />
            </div>

            {/* Legal Notice */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">Legal Notice:</span> Deletion
                fulfills NDPR Article 10 (Right to Erasure). All actions are
                recorded in the audit log.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section F: Maintenance Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Maintenance Requests</CardTitle>
            <CardDescription>
              Building-wide issues and tenant complaints (
              {property.maintenanceRequests?.length || 0} total)
            </CardDescription>
          </div>
          <CreateTicketDialog propertyId={property.id} />
        </CardHeader>
        <CardContent>
          <MaintenanceList
            requests={property.maintenanceRequests || []}
            emptyMessage="No maintenance requests for this property. Click 'Report Issue' to create one."
          />
        </CardContent>
      </Card>
    </div>
  );
}
