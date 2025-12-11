"use client";

import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import {
  ReceiptPDFDocument,
  type ReceiptPayment,
  type ReceiptTenancy,
  type ReceiptProperty,
} from "@/components/documents/receipt-pdf";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import type { FirmSettings } from "@/server/actions/settings";

type DownloadReceiptBtnProps = {
  payment: ReceiptPayment;
  tenancy: ReceiptTenancy;
  property: ReceiptProperty;
  settings: FirmSettings;
  className?: string;
};

export function DownloadReceiptBtn({
  payment,
  tenancy,
  property,
  settings,
  className,
}: DownloadReceiptBtnProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state until client-side hydration is complete
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  const fileName = `Receipt_${tenancy.tenantName.replace(
    /\s+/g,
    "_"
  )}_${payment.id.slice(-8)}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <ReceiptPDFDocument
          payment={payment}
          tenancy={tenancy}
          property={property}
          settings={settings}
        />
      }
      fileName={fileName}
    >
      {({ loading }) => (
        <Button
          variant="ghost"
          size="icon"
          disabled={loading}
          className={className}
          title="Download Receipt"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
