"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { exportExpenses } from "@/server/actions/export";
import { toast } from "sonner";

export function ExportExpensesButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const result = await exportExpenses();

      if (!result.success || !result.data) {
        toast.error(result.message || "Failed to export expenses");
        return;
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `expenses-${timestamp}.csv`;

      // Create blob from CSV content
      const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });

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

      toast.success("Expenses exported", {
        description: `Downloaded ${filename}`,
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
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      Export CSV
    </Button>
  );
}
