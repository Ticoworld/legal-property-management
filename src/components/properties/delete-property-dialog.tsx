"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteProperty } from "@/server/actions/data-privacy";
import { toast } from "sonner";

type DeletePropertyDialogProps = {
  propertyId: string;
  propertyAddress: string;
};

export function DeletePropertyDialog({
  propertyId,
  propertyAddress,
}: DeletePropertyDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmValid = confirmText === "DELETE";

  const handleDelete = async () => {
    if (!isConfirmValid) return;

    try {
      setIsDeleting(true);

      const result = await deleteProperty(propertyId);

      if (!result.success) {
        toast.error(result.message || "Failed to delete property", {
          description: "Please resolve any blocking issues and try again.",
          duration: 6000,
        });
        return;
      }

      toast.success("Property deleted successfully", {
        description:
          "All data has been permanently removed. Audit log preserved for compliance.",
        duration: 5000,
      });

      setOpen(false);

      // Redirect to properties list
      router.push("/properties");
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("An unexpected error occurred during deletion");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isDeleting) {
      setOpen(newOpen);
      if (!newOpen) {
        setConfirmText("");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          className="w-full sm:w-auto"
          data-testid="delete-property-btn"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Property
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle className="text-xl">
              Are you absolutely sure?
            </DialogTitle>
          </div>
          <DialogDescription className="text-base leading-relaxed pt-2">
            This action{" "}
            <span className="font-semibold text-foreground">
              cannot be undone
            </span>
            . This will permanently delete{" "}
            <span className="font-semibold text-foreground">
              {propertyAddress}
            </span>{" "}
            and remove all associated data from our servers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
            <h4 className="font-semibold text-sm text-destructive mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Warning: Data Erasure
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
              <li>All property information will be permanently deleted</li>
              <li>All units attached to this property will be deleted</li>
              <li>Cannot delete if property has active tenancies</li>
              <li>Audit logs will be preserved for legal compliance</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-delete" className="text-sm font-medium">
              Type{" "}
              <span className="font-mono font-bold text-destructive">
                DELETE
              </span>{" "}
              to confirm
            </Label>
            <Input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              className="font-mono"
              disabled={isDeleting}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmValid || isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Permanently
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
