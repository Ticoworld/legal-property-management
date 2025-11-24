"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { renewTenancy } from "@/server/actions/tenancy";

type RenewTenancyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenancyId: string;
  currentRent: string;
  currentExpiry: string;
};

export function RenewTenancyDialog({
  open,
  onOpenChange,
  tenancyId,
  currentRent,
  currentExpiry,
}: RenewTenancyDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newExpiryDate, setNewExpiryDate] = useState<Date | undefined>(undefined);
  const [newRent, setNewRent] = useState(currentRent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newExpiryDate) {
      toast.error("Please select a new expiry date");
      return;
    }

    setLoading(true);
    try {
      const result = await renewTenancy(
        tenancyId,
        newExpiryDate.toISOString(),
        parseFloat(newRent)
      );

      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to renew tenancy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Renew Lease</DialogTitle>
          <DialogDescription>
            Update the lease expiry date and annual rent. This will mark the tenancy as renewed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="current-expiry">Current Expiry Date</Label>
              <Input
                id="current-expiry"
                value={format(new Date(currentExpiry), "PPP")}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-expiry">New Expiry Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="new-expiry"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newExpiryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newExpiryDate ? format(newExpiryDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newExpiryDate}
                    onSelect={setNewExpiryDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-rent">Annual Rent (₦) *</Label>
              <Input
                id="new-rent"
                type="number"
                step="0.01"
                min="0"
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={newRent}
                onChange={(e) => setNewRent(e.target.value)}
                required
              />
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
            <Button type="submit" disabled={loading}>
              {loading ? "Renewing..." : "Renew Lease"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
