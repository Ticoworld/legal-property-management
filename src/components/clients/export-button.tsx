"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportClientData } from "@/server/actions/data-privacy";
import { toast } from "sonner";

type ExportButtonProps = {
  clientId: string;
  clientName?: string;
};

export function ExportButton({ clientId, clientName }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const result = await exportClientData(clientId);

      if (!result.success) {
        toast.error(result.message || "Failed to export client data");
        return;
      }

      // Convert data to JSON string with pretty formatting
      const jsonString = JSON.stringify(result.data, null, 2);

      // Create blob from JSON string
      const blob = new Blob([jsonString], { type: "application/json" });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const safeName = clientName?.replace(/\s+/g, "_") || "client";
      link.download = `client-${safeName}-${clientId.slice(0, 8)}-${timestamp}.json`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Client data exported successfully", {
        description: "Download started. Check your Downloads folder.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("An unexpected error occurred during export");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={isExporting}
      className="w-full sm:w-auto"
    >
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Export Personal Data (JSON)
        </>
      )}
    </Button>
  );
}
