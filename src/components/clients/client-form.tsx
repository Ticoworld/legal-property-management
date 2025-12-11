"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ClientSchema, type ClientInput } from "@/types/schema";
import { createClient, updateClient } from "@/server/actions/client";
import { getFirmSettings, type FirmSettings } from "@/server/actions/settings";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
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
import { FileUpload } from "@/components/ui/file-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMMON_TITLES } from "@/lib/legal-helpers";

type ClientData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  bvn: string | null;
  passportUrl: string | null;
  title: string | null;
  gender: "MALE" | "FEMALE" | "CORPORATE";
};

type Props = {
  client?: ClientData; // If provided, form is in edit mode
  onCreated?: () => void;
  onUpdated?: () => void;
  trigger?: React.ReactNode; // optional custom trigger
};

export default function ClientForm({
  client,
  onCreated,
  onUpdated,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [firmSettings, setFirmSettings] = useState<FirmSettings | null>(null);
  const isEditMode = !!client;

  const form = useForm<ClientInput>({
    resolver: zodResolver(ClientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      bankName: "",
      accountNumber: "",
      accountName: "",
      bvn: "",
      passportUrl: "",
      title: "",
      gender: "MALE",
    },
    mode: "onBlur",
  });

  // Reset form with client data when in edit mode, and fetch firm settings
  useEffect(() => {
    if (open) {
      getFirmSettings().then(setFirmSettings);
    }

    if (isEditMode && open) {
      form.reset({
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        address: client.address || "",
        bankName: client.bankName || "",
        accountNumber: client.accountNumber || "",
        accountName: client.accountName || "",
        bvn: client.bvn || "",
        passportUrl: client.passportUrl || "",
        title: client.title || "",
        gender: client.gender || "MALE",
      });
    } else if (!isEditMode && open) {
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        bankName: "",
        accountNumber: "",
        accountName: "",
        bvn: "",
        passportUrl: "",
        title: "",
        gender: "MALE",
      });
    }
  }, [isEditMode, client, open, form]);

  async function onSubmit(values: ClientInput) {
    try {
      setSubmitting(true);
      const res = isEditMode
        ? await updateClient(client.id, values)
        : await createClient(values);

      if (res.success) {
        toast.success(
          isEditMode
            ? "Client updated successfully"
            : "Client created successfully"
        );
        form.reset();
        setOpen(false);
        if (isEditMode) {
          onUpdated?.();
        } else {
          onCreated?.();
        }
      } else {
        const msg =
          typeof res.message === "string"
            ? res.message
            : `Failed to ${isEditMode ? "update" : "create"} client`;
        toast.error(msg);
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  const defaultTrigger = (
    <Button
      className="ml-auto"
      size="sm"
      variant={isEditMode ? "outline" : "default"}
    >
      {isEditMode ? "Edit Client" : "Add Client"}
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger ?? defaultTrigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0"
      >
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>{isEditMode ? "Edit Client" : "Add Client"}</SheetTitle>
          <SheetDescription>
            {isEditMode
              ? "Update client details. All fields are validated."
              : "Enter client details. All fields are validated."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <FormField
                control={form.control}
                name="passportUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passport Photo</FormLabel>
                    <FormControl>
                      <FileUpload
                        onUploadComplete={(url) => field.onChange(url)}
                        onRemove={() => field.onChange("")}
                        uploadedFiles={
                          field.value
                            ? [{ name: "Passport Photo", url: field.value }]
                            : []
                        }
                        accept=".jpg,.jpeg,.png"
                        maxSizeMB={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Title and Gender Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select title..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COMMON_TITLES.map((title) => (
                            <SelectItem key={title} value={title}>
                              {title}.
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="CORPORATE">
                            Corporate/Organization
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="08012345678 or +2348012345678"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          firmSettings
                            ? `e.g., 123 Main St, ${firmSettings.city}`
                            : "123 Main St, Abakaliki"
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Banking Details Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Banking Details (For Rent Remittance)
                </h3>

                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. GTBank" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input
                            maxLength={10}
                            placeholder="0123456789"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.replace(
                                /[^0-9]/g,
                                ""
                              );
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accountName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Account Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <SheetFooter className="px-6 py-4 border-t">
              <SheetClose asChild>
                <Button type="button" variant="outline" disabled={submitting}>
                  Cancel
                </Button>
              </SheetClose>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? isEditMode
                    ? "Updating..."
                    : "Saving..."
                  : isEditMode
                  ? "Update Client"
                  : "Save Client"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
