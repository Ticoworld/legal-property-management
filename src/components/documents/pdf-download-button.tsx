"use client";

import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { NoticeToQuitDocument } from "./notice-to-quit";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";

type PDFDownloadButtonProps = {
  tenantName: string;
  propertyAddress: string;
  expiryDate: Date;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  asMenuItem?: boolean;
};

export const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({
  tenantName,
  propertyAddress,
  expiryDate,
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

  const fileName = `Notice_to_Quit_${tenantName.replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <NoticeToQuitDocument
          tenantName={tenantName}
          propertyAddress={propertyAddress}
          expiryDate={expiryDate}
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
