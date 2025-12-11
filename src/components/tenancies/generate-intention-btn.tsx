"use client";

import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import {
  NoticeOfIntentionPDFDocument,
  type NoticeOfIntentionTenancy,
  type NoticeOfIntentionProperty,
  type NoticeOfIntentionUnit,
  type NoticeOfIntentionSolicitor,
  type NoticeOfIntentionLandlord,
} from "@/components/documents/notice-of-intention-pdf";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import type { FirmSettings } from "@/server/actions/settings";

type GenerateIntentionBtnProps = {
  tenancy: NoticeOfIntentionTenancy;
  property: NoticeOfIntentionProperty;
  unit: NoticeOfIntentionUnit;
  solicitor: NoticeOfIntentionSolicitor;
  landlord: NoticeOfIntentionLandlord;
  settings: FirmSettings;
  className?: string;
};

export function GenerateIntentionBtn({
  tenancy,
  property,
  unit,
  solicitor,
  landlord,
  settings,
  className,
}: GenerateIntentionBtnProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state until client-side hydration is complete
  if (!mounted) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        7-Day Notice
      </Button>
    );
  }

  const fileName = `Notice_of_Intention_${tenancy.tenantName.replace(
    /\s+/g,
    "_"
  )}_${new Date().toISOString().split("T")[0]}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <NoticeOfIntentionPDFDocument
          tenancy={tenancy}
          property={property}
          unit={unit}
          solicitor={solicitor}
          landlord={landlord}
          settings={settings}
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
          title="Generate Notice of Owner's Intention PDF"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}
          7-Day Notice
        </Button>
      )}
    </PDFDownloadLink>
  );
}
