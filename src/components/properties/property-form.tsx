"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PropertySchema, type PropertyInput } from "@/types/schema";
import { createProperty, updateProperty } from "@/server/actions/property";
import { getClientsForSelect } from "@/server/data/get-properties";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NigerianState, TitleType, PropertyType } from "@prisma/client";

type PropertyData = {
  id: string;
  address: string;
  city: string;
  state: NigerianState;
  titleType: TitleType;
  registrationNumber: string;
  surveyNumber: string | null;
  plotNumber: string | null;
  propertyType: PropertyType;
  ownerId: string;
};

type Props = {
  property?: PropertyData; // If provided, form is in edit mode
  onCreated?: () => void;
  onUpdated?: () => void;
  trigger?: React.ReactNode;
};

type ClientOption = {
  id: string;
  firstName: string;
  lastName: string;
  label: string;
};

type UploadedDocument = {
  url: string;
  name: string;
  type: string;
};

const NIGERIAN_STATES = [
  "ABIA", "ADAMAWA", "AKWA_IBOM", "ANAMBRA", "BAUCHI", "BAYELSA",
  "BENUE", "BORNO", "CROSS_RIVER", "DELTA", "EBONYI", "EDO",
  "EKITI", "ENUGU", "FCT", "GOMBE", "IMO", "JIGAWA", "KADUNA",
  "KANO", "KATSINA", "KEBBI", "KOGI", "KWARA", "LAGOS",
  "NASARAWA", "NIGER", "OGUN", "ONDO", "OSUN", "OYO",
  "PLATEAU", "RIVERS", "SOKOTO", "TARABA", "YOBE", "ZAMFARA"
] as const;

const TITLE_TYPES = [
  { value: "CERTIFICATE_OF_OCCUPANCY", label: "Certificate of Occupancy (C of O)" },
  { value: "DEED_OF_ASSIGNMENT", label: "Deed of Assignment" },
  { value: "DEED_OF_CONVEYANCE", label: "Deed of Conveyance" },
  { value: "GOVERNORS_CONSENT", label: "Governor's Consent" },
  { value: "REGISTERED_CONVEYANCE", label: "Registered Conveyance" },
  { value: "POWER_OF_ATTORNEY", label: "Power of Attorney" },
  { value: "OTHER", label: "Other" },
] as const;

const PROPERTY_TYPES = [
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "INDUSTRIAL", label: "Industrial" },
  { value: "MIXED_USE", label: "Mixed Use" },
  { value: "LAND", label: "Land" },
] as const;

export default function PropertyForm({ property, onCreated, onUpdated, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedDocument[]>([]);
  const isEditMode = !!property;

  const form = useForm<PropertyInput>({
    resolver: zodResolver(PropertySchema),
    defaultValues: {
      address: "",
      city: "",
      state: "LAGOS",
      titleType: "CERTIFICATE_OF_OCCUPANCY",
      registrationNumber: "",
      surveyNumber: "",
      plotNumber: "",
      propertyType: "RESIDENTIAL",
      ownerId: "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    if (open) {
      getClientsForSelect().then(setClients);
      
      // Reset form with property data when in edit mode
      if (isEditMode) {
        form.reset({
          address: property.address,
          city: property.city,
          state: property.state,
          titleType: property.titleType,
          registrationNumber: property.registrationNumber,
          surveyNumber: property.surveyNumber || "",
          plotNumber: property.plotNumber || "",
          propertyType: property.propertyType,
          ownerId: property.ownerId,
        });
      }
    }
  }, [open, isEditMode, property, form]);

  const handleUploadComplete = (url: string, name: string, type: string) => {
    setUploadedFiles((prev) => [...prev, { url, name, type }]);
    toast.success(`${name} uploaded successfully`);
  };

  const handleRemoveFile = (name: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.name !== name));
  };

  async function onSubmit(values: PropertyInput) {
    try {
      setSubmitting(true);
      const res = isEditMode
        ? await updateProperty(property.id, values, uploadedFiles)
        : await createProperty(values, uploadedFiles);
        
      if (res.success) {
        toast.success(isEditMode ? "Property updated successfully" : "Property created successfully");
        form.reset();
        setUploadedFiles([]);
        setOpen(false);
        if (isEditMode) {
          onUpdated?.();
        } else {
          onCreated?.();
        }
      } else {
        const msg = typeof res.message === "string" ? res.message : `Failed to ${isEditMode ? 'update' : 'create'} property`;
        toast.error(msg);
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  const defaultTrigger = (
    <Button className="ml-auto" size="sm" variant={isEditMode ? "outline" : "default"}>
      {isEditMode ? "Edit Property" : "Add Property"}
    </Button>
  );

  const selectedClient = clients.find((c) => c.id === form.watch("ownerId"));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger ?? defaultTrigger}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-6 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditMode ? "Edit Property" : "Add Property"}</SheetTitle>
          <SheetDescription>
            {isEditMode ? "Update property details. Select the owner from existing clients." : "Enter property details. Select the owner from existing clients."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Owner Combobox */}
              <FormField
                control={form.control}
                name="ownerId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Owner</FormLabel>
                    <Popover open={ownerOpen} onOpenChange={setOwnerOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {selectedClient
                              ? selectedClient.label
                              : "Select owner..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search clients..." />
                          <CommandList>
                            <CommandEmpty>No client found.</CommandEmpty>
                            <CommandGroup>
                              {clients.map((client) => (
                                <CommandItem
                                  key={client.id}
                                  value={client.label}
                                  onSelect={() => {
                                    form.setValue("ownerId", client.id);
                                    setOwnerOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      client.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {client.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
                      <Input placeholder="123 Lekki Phase 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Lagos" {...field} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {NIGERIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="titleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select title type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TITLE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Number</FormLabel>
                    <FormControl>
                      <Input placeholder="LR/12345/2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROPERTY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Document Upload Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Title Documents</label>
                <FileUpload
                  onUploadComplete={handleUploadComplete}
                  onRemove={handleRemoveFile}
                  uploadedFiles={uploadedFiles}
                />
              </div>

              <SheetFooter className="pt-6">
                <SheetClose asChild>
                  <Button type="button" variant="outline" disabled={submitting}>
                    Cancel
                  </Button>
                </SheetClose>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (isEditMode ? "Updating..." : "Saving...") : (isEditMode ? "Update Property" : "Save Property")}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
