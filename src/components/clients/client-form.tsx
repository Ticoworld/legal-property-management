"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ClientSchema, type ClientInput } from "@/types/schema";
import { createClient, updateClient } from "@/server/actions/client";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ClientData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string | null;
  nin: string | null;
  bvn: string | null;
};

type Props = {
  client?: ClientData; // If provided, form is in edit mode
  onCreated?: () => void;
  onUpdated?: () => void;
  trigger?: React.ReactNode; // optional custom trigger
};

export default function ClientForm({ client, onCreated, onUpdated, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isEditMode = !!client;

  const form = useForm<ClientInput>({
    resolver: zodResolver(ClientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      nin: "",
      bvn: "",
    },
    mode: "onBlur",
  });

  // Reset form with client data when in edit mode
  useEffect(() => {
    if (isEditMode && open) {
      form.reset({
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        address: client.address || "",
        nin: client.nin || "",
        bvn: client.bvn || "",
      });
    } else if (!isEditMode && open) {
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        nin: "",
        bvn: "",
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
        toast.success(isEditMode ? "Client updated successfully" : "Client created successfully");
        form.reset();
        setOpen(false);
        if (isEditMode) {
          onUpdated?.();
        } else {
          onCreated?.();
        }
      } else {
        const msg = typeof res.message === "string" ? res.message : `Failed to ${isEditMode ? 'update' : 'create'} client`;
        toast.error(msg);
      }
    } catch (e) {
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  const defaultTrigger = (
    <Button className="ml-auto" size="sm" variant={isEditMode ? "outline" : "default"}>
      {isEditMode ? "Edit Client" : "Add Client"}
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? defaultTrigger}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-6">
        <SheetHeader>
          <SheetTitle>{isEditMode ? "Edit Client" : "Add Client"}</SheetTitle>
          <SheetDescription>
            {isEditMode ? "Update client details. All fields are validated." : "Enter client details. All fields are validated."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
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
                      <Input placeholder="08012345678 or +2348012345678" {...field} />
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
                      <Input placeholder="123 Lekki Phase 1, Lagos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIN (11 digits)</FormLabel>
                    <FormControl>
                      <Input maxLength={11} placeholder="00000000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SheetFooter className="pt-6">
                <SheetClose asChild>
                  <Button type="button" variant="outline" disabled={submitting}>Cancel</Button>
                </SheetClose>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (isEditMode ? "Updating..." : "Saving...") : (isEditMode ? "Update Client" : "Save Client")}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
