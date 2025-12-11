"use client";

import React from "react";
import { Mail, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { resendPaymentReceiptEmail } from "@/server/actions/email";

type ResendEmailBtnProps = {
  payment: {
    id: string;
    date: string;
    amount: string;
    type: string;
  };
  tenancy: {
    id: string;
    tenantName: string;
    tenantEmail: string | null;
  };
  property: {
    address: string;
    city: string;
  };
  className?: string;
};

export function ResendEmailBtn({
  payment,
  tenancy,
  property,
  className,
}: ResendEmailBtnProps) {
  const [status, setStatus] = React.useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  // Don't render if no email address
  if (!tenancy.tenantEmail) {
    return null;
  }

  const handleResend = async () => {
    setStatus("loading");

    try {
      const result = await resendPaymentReceiptEmail({
        tenantName: tenancy.tenantName,
        tenantEmail: tenancy.tenantEmail!,
        amount: `₦${Number(payment.amount).toLocaleString()}`,
        propertyAddress: `${property.address}, ${property.city}`,
        date: payment.date,
        paymentType: payment.type,
        paymentId: payment.id,
      });

      if (result.success) {
        setStatus("success");
        toast.success("Receipt email sent!", {
          description: `Email sent to ${tenancy.tenantEmail}`,
        });
        // Reset to idle after 2 seconds
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        setStatus("error");
        toast.error("Failed to send email", {
          description: result.message,
        });
        // Reset to idle after 2 seconds
        setTimeout(() => setStatus("idle"), 2000);
      }
    } catch (error) {
      setStatus("error");
      toast.error("Failed to send email", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleResend}
      disabled={status === "loading"}
      className={className}
      title={`Send receipt to ${tenancy.tenantEmail}`}
    >
      {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
      {status === "idle" && <Mail className="h-4 w-4" />}
      {status === "success" && <Check className="h-4 w-4 text-green-600" />}
      {status === "error" && <X className="h-4 w-4 text-red-600" />}
    </Button>
  );
}
