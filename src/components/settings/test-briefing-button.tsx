"use client";

import { useState } from "react";
import { processDailyBriefing } from "@/server/actions/automation";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export function TestBriefingButton() {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  const handleRun = async () => {
    try {
      setLoading(true);
      // Trigger briefing manually for current user
      const result = await processDailyBriefing(session?.user?.email!);

      if (result.success) {
        toast.success(`Briefing sent! Found ${result.itemCount} items.`);
      } else {
        toast.error(result.message || "Failed to send briefing");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleRun}
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mail className="h-4 w-4" />
      )}
      Run Daily Briefing (Test)
    </Button>
  );
}
