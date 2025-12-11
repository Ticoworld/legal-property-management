"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { concludeTenancy } from "@/server/actions/tenancy";

type EndTenancyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenancyId: string;
};

export function EndTenancyDialog({
  open,
  onOpenChange,
  tenancyId,
}: EndTenancyDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [moveOutDate, setMoveOutDate] = useState<Date | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!moveOutDate) {
      toast.error("Please select a move-out date");
      return;
    }

    setLoading(true);
    try {
      const result = await concludeTenancy(
        tenancyId,
        moveOutDate.toISOString()
      );

      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to end tenancy"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            End Tenancy
          </DialogTitle>
          <DialogDescription>
            This will mark the tenancy as TERMINATED and conclude the lease.
            Please ensure all outstanding specific balances are settled or
            noted.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="move-out-date">Move Out Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="move-out-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !moveOutDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {moveOutDate ? format(moveOutDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={moveOutDate}
                    onSelect={setMoveOutDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="rounded-md bg-yellow-50 p-3 dark:bg-yellow-900/20">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                This action is irreversible. It will free up the unit for new
                tenants.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? "Ending..." : "End Tenancy"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
