"use client";

import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import {
  TenancyAgreementPDFDocument,
  type AgreementTenancy,
  type AgreementProperty,
  type AgreementUnit,
  type AgreementLandlord,
} from "@/components/documents/tenancy-agreement-pdf";
import { Button } from "@/components/ui/button";
import { FileCheck, Loader2 } from "lucide-react";

type GenerateAgreementBtnProps = {
  tenancy: AgreementTenancy;
  property: AgreementProperty;
  unit: AgreementUnit;
  landlord: AgreementLandlord;
  className?: string;
};

export function GenerateAgreementBtn({
  tenancy,
  property,
  unit,
  landlord,
  className,
}: GenerateAgreementBtnProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state until client-side hydration is complete
  if (!mounted) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Download Agreement
      </Button>
    );
  }

  const fileName = `Tenancy_Agreement_${tenancy.tenantName.replace(
    /\s+/g,
    "_"
  )}_${tenancy.id.slice(-8)}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <TenancyAgreementPDFDocument
          tenancy={tenancy}
          property={property}
          unit={unit}
          landlord={landlord}
        />
      }
      fileName={fileName}
    >
      {({ loading }) => (
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          className={className}
          title="Download Tenancy Agreement PDF"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <FileCheck className="h-4 w-4 mr-2" />
          )}
          Download Agreement
        </Button>
      )}
    </PDFDownloadLink>
  );
}
