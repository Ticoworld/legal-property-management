"use client";

import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { NoticeToQuitPDFDocument } from "./notice-to-quit-pdf"; // Used updated PDF
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import type { FirmSettings } from "@/server/actions/settings";

type PDFDownloadButtonProps = {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  asMenuItem?: boolean;
  tenancy: {
    id?: string;
    tenantName: string;
    paymentFrequency: string;
    expiryDate: Date | string;
  };
  property: {
    address: string;
    city: string;
    state: string;
  };
  unit: {
    name: string;
    type: string;
  } | null;
  landlord: {
    firstName: string;
    lastName: string;
  };
  solicitor: {
    name: string | null;
  };
  settings: FirmSettings;
};

export const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({
  tenancy,
  property,
  unit,
  landlord,
  solicitor,
  settings,
  className,
  variant = "outline",
  asMenuItem = false,
}) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    if (asMenuItem) {
      return (
        <span className={className}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </span>
      );
    }
    return (
      <Button variant={variant} size="sm" disabled className={className}>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading...
      </Button>
    );
  }

  const fileName = `Notice_to_Quit_${tenancy.tenantName.replace(
    /\s+/g,
    "_"
  )}_${new Date().getTime()}.pdf`;

  // Parse expiryDate if string
  const expiryDateObj =
    typeof tenancy.expiryDate === "string"
      ? new Date(tenancy.expiryDate)
      : tenancy.expiryDate;

  return (
    <PDFDownloadLink
      document={
        <NoticeToQuitPDFDocument
          tenancy={{ ...tenancy, expiryDate: expiryDateObj }}
          property={property}
          unit={unit}
          landlord={landlord}
          solicitor={solicitor}
          settings={settings}
        />
      }
      fileName={fileName}
    >
      {({ loading }) =>
        asMenuItem ? (
          <span className={className}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Notice to Quit
              </>
            )}
          </span>
        ) : (
          <Button
            variant={variant}
            size="sm"
            disabled={loading}
            className={className}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Notice to Quit
              </>
            )}
          </Button>
        )
      }
    </PDFDownloadLink>
  );
};
