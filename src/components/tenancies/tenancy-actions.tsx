"use client";

import { useState } from "react";
import { DollarSign, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RenewTenancyDialog } from "@/components/tenancies/renew-tenancy-dialog";
import { RecordPaymentDialog } from "@/components/tenancies/record-payment-dialog";
import { PDFDownloadButton } from "@/components/documents/pdf-download-button";

type TenancyActionsProps = {
  tenancyId: string;
  tenantName: string;
  propertyAddress: string;
  annualRent: string;
  expiryDate: Date;
};

export function TenancyActions({
  tenancyId,
  tenantName,
  propertyAddress,
  annualRent,
  expiryDate,
}: TenancyActionsProps) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);

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
        onClick={() => setRenewDialogOpen(true)}
      >
        <RefreshCw className="h-4 w-4" />
        Renew Lease
      </Button>

      <PDFDownloadButton
        tenantName={tenantName}
        propertyAddress={propertyAddress}
        expiryDate={expiryDate}
      />

      <RecordPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        tenancyId={tenancyId}
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
    </>
  );
}
