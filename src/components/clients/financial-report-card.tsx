"use client";

import { useState } from "react";
import { format, subDays, startOfYear, endOfYear } from "date-fns";
import { generateRemittanceReport } from "@/server/actions/finance";
import { RemittanceReportPDF } from "@/components/documents/remittance-report-pdf";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Loader2, FileDown, CalendarDays, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FinancialReportCard({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // Default to current year
  const [startDate, setStartDate] = useState(
    format(startOfYear(new Date()), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    format(endOfYear(new Date()), "yyyy-MM-dd")
  );
  const [rangeType, setRangeType] = useState("this_year");

  const handleRangeChange = (value: string) => {
    setRangeType(value);
    const today = new Date();
    switch (value) {
      case "this_year":
        setStartDate(format(startOfYear(today), "yyyy-MM-dd"));
        setEndDate(format(endOfYear(today), "yyyy-MM-dd"));
        break;
      case "last_30_days":
        setStartDate(format(subDays(today, 30), "yyyy-MM-dd"));
        setEndDate(format(today, "yyyy-MM-dd"));
        break;
      case "last_year":
        const lastYear = subDays(startOfYear(today), 1);
        setStartDate(format(startOfYear(lastYear), "yyyy-MM-dd"));
        setEndDate(format(endOfYear(lastYear), "yyyy-MM-dd"));
        break;
      case "custom":
        // Keep current manual selection
        break;
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setReportData(null); // Reset previous report

      const start = new Date(startDate);
      const end = new Date(endDate);

      // Basic validation
      if (start > end) {
        toast.error("Start date cannot be after end date");
        return;
      }

      const result = await generateRemittanceReport(clientId, start, end);

      if (result.success) {
        setReportData(result.data);
        toast.success("Report generated successfully. Ready for download.");
      } else {
        toast.error(result.message || "Failed to generate report");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-indigo-100 hover:border-indigo-200 transition-colors">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <CalendarDays className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Financial Reports</CardTitle>
            <CardDescription>Generate Statement of Account</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Date Range Preset</Label>
            <Select value={rangeType} onValueChange={handleRangeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this_year">This Year (YTD)</SelectItem>
                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                <SelectItem value="last_year">Last Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>From</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setRangeType("custom");
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setRangeType("custom");
                }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          {!reportData || rangeType === "custom" ? (
            // Show Generate button if no data or data might be stale (custom range logic simplified)
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Records...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Prepare Statement
                </>
              )}
            </Button>
          ) : (
            // Show Download button if data is ready
            <PDFDownloadLink
              document={<RemittanceReportPDF data={reportData} />}
              fileName={`Statement_${format(new Date(), "yyyyMMdd")}.pdf`}
              className="w-full"
            >
              {({ loading: pdfLoading }) => (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={pdfLoading}
                >
                  {pdfLoading ? (
                    "Preparing PDF..."
                  ) : (
                    <>
                      <FileDown className="mr-2 h-4 w-4" />
                      Download PDF Statement
                    </>
                  )}
                </Button>
              )}
            </PDFDownloadLink>
          )}

          {reportData && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setReportData(null)}
              title="Reset"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Preview Summary */}
        {reportData && (
          <div className="rounded-md bg-slate-50 border p-3 text-sm grid grid-cols-3 gap-2 text-center mt-2">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider">
                Collected
              </p>
              <p className="font-semibold text-green-700">
                ₦{reportData.summary.totalIncome.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider">
                Expenses
              </p>
              <p className="font-semibold text-red-600">
                (₦{reportData.summary.totalExpenses.toLocaleString()})
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider">
                Net
              </p>
              <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 mt-1">
                ₦{reportData.summary.netRemittance.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
