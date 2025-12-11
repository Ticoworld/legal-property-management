"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { ExpenseSchema, type ExpenseInput } from "@/types/schema";
import { recordExpense } from "@/server/actions/finance";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface RecordExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenancyId: string;
  propertyId: string;
  tenantName: string;
  propertyAddress: string;
  onSuccess?: () => void;
}

export function RecordExpenseDialog({
  open,
  onOpenChange,
  tenancyId,
  propertyId,
  tenantName,
  propertyAddress,
  onSuccess,
}: RecordExpenseDialogProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ExpenseInput>({
    resolver: zodResolver(ExpenseSchema),
    defaultValues: {
      amount: "" as unknown as number,
      date: new Date(),
      category: "REPAIR",
      description: "",
      tenancyId,
      propertyId,
    },
  });

  const onSubmit = (data: ExpenseInput) => {
    startTransition(async () => {
      try {
        const result = await recordExpense(data);

        if (result.success) {
          toast.success(result.message);
          form.reset();
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(result.message);
          if (result.errors) {
            console.error("Validation errors:", result.errors);
          }
        }
      } catch (error) {
        console.error("Submit error:", error);
        toast.error("Failed to record expense. Please try again.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Record Expense</DialogTitle>
          <DialogDescription>
            Record an expense for <strong>{propertyAddress}</strong> related to{" "}
            <strong>{tenantName}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => {
                  const displayValue = field.value
                    ? Number(field.value).toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })
                    : "";

                  return (
                    <FormItem>
                      <FormLabel>Amount (₦)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="0"
                          value={displayValue}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/,/g, "");
                            if (rawValue === "" || rawValue === "-") {
                              field.onChange("");
                            } else if (!isNaN(Number(rawValue))) {
                              field.onChange(parseFloat(rawValue));
                            }
                          }}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Cost of the expense
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="REPAIR">
                        Repair & Maintenance
                      </SelectItem>
                      <SelectItem value="AGENCY_FEE">Agency Fee</SelectItem>
                      <SelectItem value="LEGAL_FEE">Legal Fee</SelectItem>
                      <SelectItem value="UTILITY">Utility Bill</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the expense (e.g., 'Fixed leaking pipe in kitchen')"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Recording..." : "Record Expense"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
