import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Building2,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { auth } from "@/auth";
import { getClient } from "@/server/data/get-client";
import { EditClientButton } from "@/components/clients/edit-client-button";
import { ExportButton } from "@/components/clients/export-button";
import { DeleteClientDialog } from "@/components/clients/delete-client-dialog";
import { FinancialReportCard } from "@/components/clients/financial-report-card";
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

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClientProfilePage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const client = await getClient(id);

  if (!client) {
    notFound();
  }

  const fullName = `${client.firstName} ${client.lastName}`;
  const userRole = session?.user?.role as UserRole | undefined;
  const showDangerZone = userRole && canDeleteAssets(userRole);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" className="gap-2" asChild>
        <Link href="/clients">
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{fullName}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Building2 className="h-3 w-3" />
              {client.properties.length}{" "}
              {client.properties.length === 1 ? "Property" : "Properties"}
            </Badge>
          </div>
        </div>
        <EditClientButton client={client} />
      </div>

      <Separator />

      {/* Section A: Personal Details */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
          <CardDescription>
            Contact information and identification details
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 rounded-md bg-primary/10">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-muted-foreground">
                  Email
                </p>
                <p className="text-sm">{client.email || "—"}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 rounded-md bg-primary/10">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-muted-foreground">
                  Phone
                </p>
                <p className="text-sm">{client.phone || "—"}</p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 rounded-md bg-primary/10">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-muted-foreground">
                  Address
                </p>
                <p className="text-sm">{client.address || "—"}</p>
              </div>
            </div>

            {/* Bank Account */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 rounded-md bg-primary/10">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-muted-foreground">
                  Bank Account
                </p>
                {client.accountNumber ? (
                  <div className="text-sm">
                    <p className="font-mono">{client.accountNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {client.bankName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {client.accountName}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm">—</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section B: Property Portfolio */}
      <Card>
        <CardHeader>
          <CardTitle>Property Portfolio</CardTitle>
          <CardDescription>All properties owned by this client</CardDescription>
        </CardHeader>
        <CardContent>
          {client.properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm font-medium text-muted-foreground">
                No Properties Found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This client does not own any properties yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Title Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">
                      {property.address}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{property.titleType}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {property.city}, {property.state}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/properties/${property.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Section C: Financial Reports */}
      <FinancialReportCard clientId={client.id} />

      {/* Section D: Data Privacy & Control (SUPER_ADMIN ONLY) */}
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
              NDPR Compliance: Export or permanently delete client data. Admin
              access only.
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
                    These actions are permanent and cannot be undone. Data
                    exports include all personal information (decrypted).
                    Deletions are blocked if the client has active properties.
                    All actions are logged for compliance.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <ExportButton clientId={client.id} clientName={fullName} />
              <DeleteClientDialog clientId={client.id} clientName={fullName} />
            </div>

            {/* Legal Notice */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">Legal Notice:</span> Export
                fulfills NDPR Article 8 (Right to Data Portability). Deletion
                fulfills NDPR Article 10 (Right to Erasure). All actions are
                recorded in the audit log.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
