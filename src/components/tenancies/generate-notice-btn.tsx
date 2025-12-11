"use client";

import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import {
  NoticeToQuitPDFDocument,
  type NoticeToQuitTenancy,
  type NoticeToQuitProperty,
  type NoticeToQuitUnit,
  type NoticeToQuitSolicitor,
  type NoticeToQuitLandlord,
} from "@/components/documents/notice-to-quit-pdf";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import type { FirmSettings } from "@/server/actions/settings";

type GenerateNoticeBtnProps = {
  tenancy: NoticeToQuitTenancy;
  property: NoticeToQuitProperty;
  unit: NoticeToQuitUnit;
  solicitor: NoticeToQuitSolicitor;
  landlord: NoticeToQuitLandlord;
  settings: FirmSettings;
  className?: string;
};

export function GenerateNoticeBtn({
  tenancy,
  property,
  unit,
  solicitor,
  landlord,
  settings,
  className,
}: GenerateNoticeBtnProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state until client-side hydration is complete
  if (!mounted) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Generate Notice
      </Button>
    );
  }

  const fileName = `Notice_to_Quit_${tenancy.tenantName.replace(/\s+/g, "_")}_${
    new Date().toISOString().split("T")[0]
  }.pdf`;

  return (
    <PDFDownloadLink
      document={
        <NoticeToQuitPDFDocument
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
          title="Generate Notice to Quit PDF"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}
          Generate Notice
        </Button>
      )}
    </PDFDownloadLink>
  );
}
