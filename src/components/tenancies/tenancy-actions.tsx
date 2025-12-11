"use client";

import { useState, useEffect } from "react";
import { DollarSign, RefreshCw, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RenewTenancyDialog } from "@/components/tenancies/renew-tenancy-dialog";
import { RecordPaymentDialog } from "@/components/tenancies/record-payment-dialog";
import { PDFDownloadButton } from "@/components/documents/pdf-download-button";
import { RecordExpenseDialog } from "@/components/tenancies/record-expense-dialog";
import { getFirmSettings, type FirmSettings } from "@/server/actions/settings";
import { EndTenancyDialog } from "@/components/tenancies/end-tenancy-dialog";

type TenancyActionsProps = {
  tenancyId: string;
  propertyId: string;
  tenantName: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  annualRent: string;
  expiryDate: Date;
  landlord: {
    firstName: string;
    lastName: string;
  };
  unit: {
    name: string;
    type: string;
  } | null;
  paymentFrequency: string | null;
  status: string;
};

export function TenancyActions({
  tenancyId,
  propertyId,
  tenantName,
  propertyAddress,
  propertyCity,
  propertyState,
  annualRent,
  expiryDate,
  landlord,
  unit,
  paymentFrequency,
  status,
}: TenancyActionsProps) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [endTenancyDialogOpen, setEndTenancyDialogOpen] = useState(false);
  const [firmSettings, setFirmSettings] = useState<FirmSettings | null>(null);

  useEffect(() => {
    getFirmSettings().then(setFirmSettings);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => setPaymentDialogOpen(true)}
      >
        <DollarSign className="h-4 w-4" />
        Record Payment
      </Button>

      <Button
        variant="outline"
        className="gap-2"
        onClick={() => setExpenseDialogOpen(true)}
      >
        <Wrench className="h-4 w-4" />
        Record Expense
      </Button>

      <Button
        variant="outline"
        className="gap-2"
        onClick={() => setRenewDialogOpen(true)}
        disabled={status === "TERMINATED"}
        title={
          status === "TERMINATED" ? "Tenancy is already concluded" : undefined
        }
      >
        <RefreshCw className="h-4 w-4" />
        Renew Lease
      </Button>

      <Button
        variant="outline"
        className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
        onClick={() => setEndTenancyDialogOpen(true)}
        disabled={status === "TERMINATED"}
        title={
          status === "TERMINATED" ? "Tenancy is already concluded" : undefined
        }
      >
        <DollarSign className="h-4 w-4 rotate-45" />{" "}
        {/* Using rotate as a visual for 'end' or maybe a better icon like XCircle if available, but staying consistent with imports */}
        End Tenancy
      </Button>

      {firmSettings && (
        <PDFDownloadButton
          tenancy={{
            id: tenancyId,
            tenantName: tenantName,
            paymentFrequency: paymentFrequency || "N/A",
            expiryDate: expiryDate,
          }}
          property={{
            address: propertyAddress,
            city: propertyCity,
            state: propertyState,
          }}
          unit={unit}
          landlord={landlord}
          solicitor={{ name: null }}
          settings={firmSettings!}
        />
      )}

      <RecordPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        tenancyId={tenancyId}
        tenantName={tenantName}
        propertyAddress={propertyAddress}
      />

      <RecordExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        tenancyId={tenancyId}
        propertyId={propertyId}
        tenantName={tenantName}
        propertyAddress={propertyAddress}
      />

      <RenewTenancyDialog
        open={renewDialogOpen}
        onOpenChange={setRenewDialogOpen}
        tenancyId={tenancyId}
        currentRent={annualRent}
        currentExpiry={expiryDate.toISOString()}
      />

      <EndTenancyDialog
        open={endTenancyDialogOpen}
        onOpenChange={setEndTenancyDialogOpen}
        tenancyId={tenancyId}
      />
    </>
  );
}
