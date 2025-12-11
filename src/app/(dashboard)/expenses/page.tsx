import { getExpenses } from "@/server/data/get-expenses";
import { getCurrentUser } from "@/lib/auth-helper";
import { formatNaira } from "@/lib/utils";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportExpensesButton } from "@/components/admin/export-expenses-button";
import { Receipt } from "lucide-react";

export const dynamic = "force-dynamic";

const categoryLabels: Record<string, string> = {
  REPAIR: "Repair",
  AGENCY_FEE: "Agency Fee",
  LEGAL_FEE: "Legal Fee",
  UTILITY: "Utility",
  OTHER: "Other",
};

const categoryColors: Record<string, string> = {
  REPAIR: "bg-orange-500",
  AGENCY_FEE: "bg-purple-500",
  LEGAL_FEE: "bg-blue-500",
  UTILITY: "bg-green-500",
  OTHER: "bg-gray-500",
};

export default async function ExpensesPage() {
  await getCurrentUser();
  const { expenses, totalYTD } = await getExpenses();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Expenses</h1>
        <ExportExpensesButton />
      </div>

      {/* YTD Total Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Expenses (YTD)
          </CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatNaira(totalYTD.toString())}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {expenses.length} expenses recorded
          </p>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[12%]">Date</TableHead>
              <TableHead className="w-[25%]">Property</TableHead>
              <TableHead className="w-[12%]">Category</TableHead>
              <TableHead className="w-[12%]">Amount</TableHead>
              <TableHead className="w-[25%]">Description</TableHead>
              <TableHead className="w-[14%]">Recorded By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  No expenses found.
                </TableCell>
              </TableRow>
            )}
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="text-sm">
                  {format(new Date(expense.date), "MMM dd, yyyy")}
                </TableCell>
                <TableCell className="font-medium">
                  {expense.propertyAddress}
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${
                      categoryColors[expense.category] || "bg-gray-500"
                    } text-white`}
                  >
                    {categoryLabels[expense.category] || expense.category}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-red-600 font-semibold">
                  {formatNaira(expense.amount.toString())}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {expense.description}
                </TableCell>
                <TableCell className="text-sm">
                  {expense.recordedByName}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
