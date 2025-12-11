"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  updateFirmSettings,
  type FirmSettings,
} from "@/server/actions/settings";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";

const FirmSettingsSchema = z.object({
  firmName: z.string().min(1, "Firm name is required"),
  chambersName: z.string().min(1, "Chambers name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  solicitorName: z.string().min(1, "Solicitor name is required"),
  solicitorTitle: z.string().min(1, "Solicitor title is required"),
});

type FirmSettingsFormValues = z.infer<typeof FirmSettingsSchema>;

type Props = {
  settings: FirmSettings;
  canEdit: boolean;
};

export function FirmSettingsForm({ settings, canEdit }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FirmSettingsFormValues>({
    resolver: zodResolver(FirmSettingsSchema),
    defaultValues: {
      firmName: settings.firmName,
      chambersName: settings.chambersName,
      address: settings.address,
      city: settings.city,
      state: settings.state,
      solicitorName: settings.solicitorName,
      solicitorTitle: settings.solicitorTitle,
    },
  });

  async function onSubmit(values: FirmSettingsFormValues) {
    try {
      setSubmitting(true);
      const res = await updateFirmSettings(values);

      if (res.success) {
        toast.success("Firm settings updated successfully");
      } else {
        toast.error(res.message || "Failed to update settings");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Firm Identity */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Firm Identity
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firmName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Firm Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ogodo, Ogodo & Co."
                      disabled={!canEdit}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="chambersName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chambers Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Beracah Chambers"
                      disabled={!canEdit}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Location */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Location
          </h3>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="14 Ojeawere Street, Abakaliki, Ebonyi State"
                    disabled={!canEdit}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Abakaliki"
                      disabled={!canEdit}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ebonyi"
                      disabled={!canEdit}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Solicitor Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Principal Solicitor
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="solicitorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Solicitor Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="K. O. Ogboso, Esq."
                      disabled={!canEdit}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="solicitorTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Legal Practitioner"
                      disabled={!canEdit}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {canEdit && (
          <div className="pt-4 border-t flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}

        {!canEdit && (
          <p className="text-sm text-muted-foreground italic">
            Only Super Admin can edit firm settings.
          </p>
        )}
      </form>
    </Form>
  );
}
