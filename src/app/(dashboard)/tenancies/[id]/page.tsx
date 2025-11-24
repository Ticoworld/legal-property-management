import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, TrendingUp, Calendar, DollarSign, CheckCircle2, FileText } from "lucide-react";
import { getTenancy } from "@/server/data/get-tenancy";
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

type PageProps = {
  params: Promise<{ id: string }>;
};

function getStatusInfo(daysRemaining: number) {
  if (daysRemaining < 0) {
    return { 
      label: "Expired", 
      variant: "destructive" as const,
      color: "bg-red-600",
      textColor: "text-red-600"
    };
  }
  if (daysRemaining <= 30) {
    return { 
      label: "Critical", 
      variant: "destructive" as const,
      color: "bg-red-500",
      textColor: "text-red-600"
    };
  }
  if (daysRemaining <= 90) {
    return { 
      label: "Expiring Soon", 
      variant: "secondary" as const,
      color: "bg-yellow-500",
      textColor: "text-yellow-600"
    };
  }
  return { 
    label: "Active", 
    variant: "default" as const,
    color: "bg-green-600",
    textColor: "text-green-600"
  };
}

export default async function TenancyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const tenancy = await getTenancy(id);

  if (!tenancy) {
    notFound();
  }

  const status = getStatusInfo(tenancy.daysRemaining);
  const propertyAddress = `${tenancy.property.address}, ${tenancy.property.city}`;
  const annualRent = Number(tenancy.annualRent);
  const paymentProgress = annualRent > 0 
    ? (tenancy.totalPaid / annualRent) * 100 
    : 0;

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
          <h1 className="text-3xl font-bold tracking-tight">{tenancy.tenantName}</h1>
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
              status.label === "Active" && "bg-green-600 text-white border-transparent",
              status.label === "Expiring Soon" && "bg-yellow-500 text-white border-transparent",
              (status.label === "Critical" || status.label === "Expired") && "bg-red-600 text-white border-transparent"
            )}
          >
            {status.label === "Expired" ? (
              <AlertTriangle className="h-3 w-3" />
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
            annualRent={tenancy.annualRent.toString()}
            expiryDate={tenancy.expiryDate}
          />
        </div>
      </div>

      <Separator />

      {/* Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Countdown Card */}
        <Card className={cn(
          "border-2",
          tenancy.daysRemaining < 0 && "border-red-200 bg-red-50/50",
          tenancy.daysRemaining >= 0 && tenancy.daysRemaining <= 30 && "border-red-200 bg-red-50/50",
          tenancy.daysRemaining > 30 && tenancy.daysRemaining <= 90 && "border-yellow-200 bg-yellow-50/50",
          tenancy.daysRemaining > 90 && "border-green-200 bg-green-50/50"
        )}>
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
                  : `Expires ${format(tenancy.expiryDate, "MMM dd, yyyy")}`
                }
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
              <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold font-mono text-green-600">
                {formatNaira(tenancy.totalPaid.toString())}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Balance</p>
              <p className={cn(
                "text-2xl font-bold font-mono",
                tenancy.balance > 0 ? "text-red-600" : "text-green-600"
              )}>
                {tenancy.balance === 0 
                  ? "Paid" 
                  : formatNaira(Math.abs(tenancy.balance).toString())
                }
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Payment Progress</p>
              <div className="space-y-2">
                <Progress value={Math.min(paymentProgress, 100)} className="h-2" />
                <p className="text-sm font-medium">
                  {paymentProgress.toFixed(1)}% Paid
                </p>
              </div>
            </div>
          </div>

          {tenancy.balance > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50/50 p-4">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-900">Outstanding Balance</p>
                <p className="text-sm text-yellow-700">
                  {tenancy.balance > 0 
                    ? `The tenant has an outstanding balance of ${formatNaira(tenancy.balance.toString())}. Consider following up on payment.`
                    : "All payments have been received."
                  }
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
            All recorded payments for this tenancy ({tenancy.payments.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tenancy.payments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No payments recorded yet</p>
              <p className="text-xs mt-1">Record the first payment to track financial status</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[15%]">Date</TableHead>
                    <TableHead className="w-[15%]">Type</TableHead>
                    <TableHead className="w-[15%]">Method</TableHead>
                    <TableHead className="w-[20%] text-right">Amount</TableHead>
                    <TableHead className="w-[15%]">Reference</TableHead>
                    <TableHead className="w-[20%]">Recorded By</TableHead>
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
                        {payment.recordedByUser.name || payment.recordedByUser.email}
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
    </div>
  );
}
