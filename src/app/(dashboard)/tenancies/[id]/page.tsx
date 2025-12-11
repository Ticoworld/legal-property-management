import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { auth } from "@/auth";
import { getTenancy } from "@/server/data/get-tenancy";
import { getFirmSettings } from "@/server/actions/settings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { format } from "date-fns";
import { formatNaira, cn } from "@/lib/utils";
import { TenancyActions } from "@/components/tenancies/tenancy-actions";
import { MaintenanceList } from "@/components/maintenance/maintenance-list";
import { CreateTicketDialog } from "@/components/maintenance/create-ticket-dialog";
import { DownloadReceiptBtn } from "@/components/finance/download-receipt-btn";
import { ResendEmailBtn } from "@/components/finance/resend-email-btn";
import { GenerateNoticeBtn } from "@/components/tenancies/generate-notice-btn";
import { GenerateIntentionBtn } from "@/components/tenancies/generate-intention-btn";

type PageProps = {
  params: Promise<{ id: string }>;
};

function getStatusInfo(daysRemaining: number, status: string) {
  if (status === "TERMINATED") {
    return {
      label: "Terminated",
      variant: "secondary" as const,
      color: "bg-gray-500",
      textColor: "text-gray-500",
    };
  }
  if (daysRemaining < 0) {
    return {
      label: "Expired",
      variant: "destructive" as const,
      color: "bg-red-600",
      textColor: "text-red-600",
    };
  }
  if (daysRemaining <= 30) {
    return {
      label: "Critical",
      variant: "destructive" as const,
      color: "bg-red-500",
      textColor: "text-red-600",
    };
  }
  if (daysRemaining <= 90) {
    return {
      label: "Expiring Soon",
      variant: "secondary" as const,
      color: "bg-yellow-500",
      textColor: "text-yellow-600",
    };
  }
  return {
    label: "Active",
    variant: "default" as const,
    color: "bg-green-600",
    textColor: "text-green-600",
  };
}

export default async function TenancyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [tenancy, session, firmSettings] = await Promise.all([
    getTenancy(id),
    auth(),
    getFirmSettings(),
  ]);

  if (!tenancy) {
    notFound();
  }

  const status = getStatusInfo(tenancy.daysRemaining, tenancy.status);
  const propertyAddress = `${tenancy.property.address}, ${tenancy.property.city}`;
  const annualRent = Number(tenancy.annualRent);
  const paymentProgress =
    annualRent > 0 ? (tenancy.totalPaid / annualRent) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" className="gap-2" asChild>
        <Link href="/tenancies">
          <ArrowLeft className="h-4 w-4" />
          Back to Tenancies
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {tenancy.tenantName}
          </h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {propertyAddress}
            </span>
          </div>
          <Badge
            variant={status.variant}
            className={cn(
              "gap-1",
              status.label === "Active" &&
                "bg-green-600 text-white border-transparent",
              status.label === "Expiring Soon" &&
                "bg-yellow-500 text-white border-transparent",
              (status.label === "Critical" || status.label === "Expired") &&
                "bg-red-600 text-white border-transparent",
              status.label === "Terminated" &&
                "bg-gray-500 text-white border-transparent"
            )}
          >
            {status.label === "Expired" ? (
              <AlertTriangle className="h-3 w-3" />
            ) : status.label === "Terminated" ? (
              <CheckCircle2 className="h-3 w-3" /> // or maybe a StopCircle/Ban icon
            ) : (
              <CheckCircle2 className="h-3 w-3" />
            )}
            {status.label}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <TenancyActions
            tenancyId={tenancy.id}
            tenantName={tenancy.tenantName}
            propertyAddress={propertyAddress}
            propertyCity={tenancy.property.city}
            propertyState={tenancy.property.state}
            annualRent={tenancy.annualRent.toString()}
            expiryDate={tenancy.expiryDate}
            propertyId={tenancy.property.id}
            landlord={{
              firstName: tenancy.property.owner.firstName,
              lastName: tenancy.property.owner.lastName,
            }}
            unit={
              tenancy.unit
                ? {
                    name: tenancy.unit.name,
                    type: tenancy.unit.type,
                  }
                : null
            }
            paymentFrequency={tenancy.paymentFrequency}
            status={tenancy.status}
          />
        </div>
      </div>

      {/* Legal Alert - Notice Date (Only for ACTIVE tenancies) */}
      {tenancy.status === "ACTIVE" && tenancy.suggestedNoticeDate && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-800 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Legal Notice Requirement
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Based on the{" "}
                {tenancy.paymentFrequency?.toLowerCase().replace("_", " ") ??
                  "specified"}{" "}
                payment frequency, the suggested date to serve a Quit Notice is{" "}
                <strong>
                  {format(
                    new Date(tenancy.suggestedNoticeDate),
                    "MMMM dd, yyyy"
                  )}
                </strong>
                .
              </p>
            </div>
          </div>
          <GenerateNoticeBtn
            tenancy={{
              id: tenancy.id,
              tenantName: tenancy.tenantName,
              paymentFrequency: tenancy.paymentFrequency,
              expiryDate: tenancy.expiryDate,
            }}
            property={{
              address: tenancy.property.address,
              city: tenancy.property.city,
              state: tenancy.property.state,
            }}
            unit={
              tenancy.unit
                ? {
                    name: tenancy.unit.name,
                    type: tenancy.unit.type,
                  }
                : null
            }
            solicitor={{
              name: session?.user?.name ?? null,
            }}
            landlord={{
              firstName: tenancy.property.owner.firstName,
              lastName: tenancy.property.owner.lastName,
            }}
            settings={firmSettings}
          />
          <GenerateIntentionBtn
            tenancy={{
              id: tenancy.id,
              tenantName: tenancy.tenantName,
              paymentFrequency: tenancy.paymentFrequency,
              expiryDate: tenancy.expiryDate,
            }}
            property={{
              address: tenancy.property.address,
              city: tenancy.property.city,
              state: tenancy.property.state,
            }}
            unit={
              tenancy.unit
                ? {
                    name: tenancy.unit.name,
                    type: tenancy.unit.type,
                  }
                : null
            }
            solicitor={{
              name: session?.user?.name ?? null,
            }}
            landlord={{
              firstName: tenancy.property.owner.firstName,
              lastName: tenancy.property.owner.lastName,
            }}
            settings={firmSettings}
          />
        </div>
      )}

      <Separator />

      {/* Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Countdown Card */}
        <Card
          className={cn(
            "border-2",
            tenancy.daysRemaining < 0 &&
              "border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800",
            tenancy.daysRemaining >= 0 &&
              tenancy.daysRemaining <= 30 &&
              "border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800",
            tenancy.daysRemaining > 30 &&
              tenancy.daysRemaining <= 90 &&
              "border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-800",
            tenancy.daysRemaining > 90 &&
              "border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800"
          )}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              {tenancy.daysRemaining < 0 ? "Expired" : "Days Remaining"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className={cn("text-4xl font-bold", status.textColor)}>
                {tenancy.daysRemaining < 0 ? 0 : tenancy.daysRemaining}
              </p>
              <p className="text-sm text-muted-foreground">
                {tenancy.daysRemaining < 0
                  ? `Expired ${Math.abs(tenancy.daysRemaining)} days ago`
                  : `Expires ${format(tenancy.expiryDate, "MMM dd, yyyy")}`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Lease Duration Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Lease Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {format(tenancy.startDate, "MMM dd, yyyy")}
              </p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs">to</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <p className="text-sm font-medium">
                {format(tenancy.expiryDate, "MMM dd, yyyy")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Annual Rent Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Annual Rent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold font-mono">
                {formatNaira(tenancy.annualRent.toString())}
              </p>
              <p className="text-xs text-muted-foreground">
                {tenancy.paymentFrequency || "Payment terms not specified"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
          <CardDescription>
            Payment status and outstanding balance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Total Paid
              </p>
              <p className="text-2xl font-bold font-mono text-green-600 dark:text-green-500">
                {formatNaira(tenancy.totalPaid.toString())}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Balance
              </p>
              <p
                className={cn(
                  "text-2xl font-bold font-mono",
                  tenancy.balance > 0
                    ? "text-red-600 dark:text-red-500"
                    : "text-green-600 dark:text-green-500"
                )}
              >
                {tenancy.balance === 0
                  ? "Paid"
                  : formatNaira(Math.abs(tenancy.balance).toString())}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Total Expenses
              </p>
              <p className="text-2xl font-bold font-mono text-red-600 dark:text-red-500">
                {formatNaira(tenancy.financials.totalExpenses.toString())}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Net Remittance
              </p>
              <p className="text-2xl font-bold font-mono text-gray-900 dark:text-gray-100">
                {formatNaira(tenancy.financials.netRemittance.toString())}
              </p>
              <p className="text-xs text-muted-foreground">
                (Income - Expenses)
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Payment Progress
              </p>
              <div className="space-y-2">
                <Progress
                  value={Math.min(paymentProgress, 100)}
                  className="h-2"
                />
                <p className="text-sm font-medium">
                  {paymentProgress.toFixed(1)}% Paid
                </p>
              </div>
            </div>
          </div>

          {tenancy.balance > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/30 dark:border-yellow-800 p-4">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  Outstanding Balance
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {tenancy.balance > 0
                    ? `The tenant has an outstanding balance of ${formatNaira(
                        tenancy.balance.toString()
                      )}. Consider following up on payment.`
                    : "All payments have been received."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            All recorded payments for this tenancy ({tenancy.payments.length}{" "}
            total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tenancy.payments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No payments recorded yet</p>
              <p className="text-xs mt-1">
                Record the first payment to track financial status
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[12%]">Date</TableHead>
                    <TableHead className="w-[12%]">Type</TableHead>
                    <TableHead className="w-[12%]">Method</TableHead>
                    <TableHead className="w-[18%] text-right">Amount</TableHead>
                    <TableHead className="w-[12%]">Reference</TableHead>
                    <TableHead className="w-[18%]">Recorded By</TableHead>
                    <TableHead className="w-[10%] text-center">
                      Receipt
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {tenancy.payments.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {format(new Date(payment.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payment.method}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-green-600">
                        {formatNaira(payment.amount.toString())}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payment.reference || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {payment.recordedByUser.name ||
                          payment.recordedByUser.email}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <DownloadReceiptBtn
                            payment={{
                              id: payment.id,
                              date: new Date(payment.date).toISOString(),
                              amount: payment.amount.toString(),
                              type: payment.type,
                              method: payment.method,
                              reference: payment.reference,
                            }}
                            tenancy={{
                              id: tenancy.id,
                              tenantName: tenancy.tenantName,
                              tenantPhone: tenancy.tenantPhone,
                              tenantEmail: tenancy.tenantEmail,
                            }}
                            property={{
                              address: tenancy.property.address,
                              city: tenancy.property.city,
                            }}
                            settings={firmSettings}
                          />
                          <ResendEmailBtn
                            payment={{
                              id: payment.id,
                              date: new Date(payment.date).toISOString(),
                              amount: payment.amount.toString(),
                              type: payment.type,
                            }}
                            tenancy={{
                              id: tenancy.id,
                              tenantName: tenancy.tenantName,
                              tenantEmail: tenancy.tenantEmail,
                            }}
                            property={{
                              address: tenancy.property.address,
                              city: tenancy.property.city,
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expenses History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses History</CardTitle>
          <CardDescription>
            All recorded expenses/repairs for this tenancy (
            {tenancy.expenses.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tenancy.expenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No expenses recorded yet</p>
              <p className="text-xs mt-1">
                Record expenses to track repair costs
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[15%]">Date</TableHead>
                    <TableHead className="w-[15%]">Category</TableHead>
                    <TableHead className="w-[30%]">Description</TableHead>
                    <TableHead className="w-[20%] text-right">Amount</TableHead>
                    <TableHead className="w-[20%]">Recorded By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {tenancy.expenses.map((expense: any) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {format(new Date(expense.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {expense.description || "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-red-600">
                        {formatNaira(expense.amount.toString())}
                      </TableCell>
                      <TableCell className="text-sm">
                        {expense.recordedByUser.name ||
                          expense.recordedByUser.email}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Tenant contact details</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Phone</p>
            <p className="text-sm">{tenancy.tenantPhone}</p>
          </div>
          {tenancy.tenantEmail && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{tenancy.tenantEmail}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Requests Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Maintenance Requests</CardTitle>
            <CardDescription>
              Tenant complaints and repair requests (
              {tenancy.maintenanceRequests?.length || 0} total)
            </CardDescription>
          </div>
          <CreateTicketDialog
            propertyId={tenancy.property.id}
            unitId={tenancy.unitId}
            tenancyId={tenancy.id}
          />
        </CardHeader>
        <CardContent>
          <MaintenanceList
            requests={tenancy.maintenanceRequests || []}
            emptyMessage="No maintenance requests for this tenancy yet. Click 'Report Issue' to create one."
          />
        </CardContent>
      </Card>

      {/* Guarantor & Next of Kin Info */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Contacts</CardTitle>
          <CardDescription>Guarantor and Next of Kin details</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Guarantor
            </h4>
            {tenancy.guarantorName ? (
              <div className="space-y-2">
                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{tenancy.guarantorName}</span>

                  <span className="text-muted-foreground">Phone:</span>
                  <span>{tenancy.guarantorPhone || "—"}</span>

                  <span className="text-muted-foreground">Address:</span>
                  <span>{tenancy.guarantorAddress || "—"}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No guarantor details recorded
              </p>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Next of Kin
            </h4>
            {tenancy.nextOfKinName ? (
              <div className="space-y-2">
                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{tenancy.nextOfKinName}</span>

                  <span className="text-muted-foreground">Phone:</span>
                  <span>{tenancy.nextOfKinPhone || "—"}</span>

                  <span className="text-muted-foreground">Relation:</span>
                  <span>{tenancy.nextOfKinRelationship || "—"}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No next of kin details recorded
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
