"use client";

import { useState } from "react";
import {
  Download,
  Loader2,
  FileSpreadsheet,
  Building2,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { exportProperties, exportFinancials } from "@/server/actions/export";

type ExportType = "properties" | "financials";

export function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<ExportType | null>(null);

  const downloadCsv = (csvContent: string, filename: string) => {
    // Create blob from CSV content
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExportProperties = async () => {
    try {
      setIsExporting(true);
      setExportType("properties");

      const result = await exportProperties();

      if (!result.success || !result.data) {
        toast.error(result.message || "Failed to export properties");
        return;
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `property-list-${timestamp}.csv`;

      downloadCsv(result.data, filename);

      toast.success("Property list exported", {
        description: `Downloaded ${filename}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("An unexpected error occurred during export");
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const handleExportFinancials = async () => {
    try {
      setIsExporting(true);
      setExportType("financials");

      // Export current year (YTD)
      const currentYear = new Date().getFullYear();
      const result = await exportFinancials(currentYear);

      if (!result.success || !result.data) {
        toast.error(result.message || "Failed to export financial report");
        return;
      }

      // Generate filename with year
      const filename = `financial-report-${currentYear}.csv`;

      downloadCsv(result.data, filename);

      toast.success("Financial report exported", {
        description: `Downloaded ${filename}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("An unexpected error occurred during export");
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export Data
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleExportProperties}
          disabled={isExporting}
          className="cursor-pointer"
        >
          {isExporting && exportType === "properties" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Building2 className="mr-2 h-4 w-4" />
          )}
          <span>Property List</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleExportFinancials}
          disabled={isExporting}
          className="cursor-pointer"
        >
          {isExporting && exportType === "financials" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <DollarSign className="mr-2 h-4 w-4" />
          )}
          <span>Financial Report (YTD)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
