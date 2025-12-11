"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown, Lock } from "lucide-react";
import { TenancySchema, type TenancyInput } from "@/types/schema";
import { createTenancy } from "@/server/actions/tenancy";
import { getPropertiesForSelect } from "@/server/data/get-properties";
import { getPropertyUnits } from "@/server/actions/property";
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
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { cn } from "@/lib/utils";
import { COMMON_TITLES } from "@/lib/legal-helpers";

const PAYMENT_FREQUENCIES = [
  { value: "ANNUALLY", label: "Annually" },
  { value: "BI_ANNUALLY", label: "Bi-Annually (Every 6 Months)" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "MONTHLY", label: "Monthly" },
] as const;

type Props = {
  onCreated?: () => void;
  trigger?: React.ReactNode;
};

type PropertyOption = {
  id: string;
  address: string;
  ownerName: string;
  label: string;
};

type TenancyFormInput = Omit<
  TenancyInput,
  "startDate" | "expiryDate" | "status"
> & {
  startDate: Date;
  expiryDate: Date;
  status?: TenancyInput["status"];
  unitId?: string;
};

export default function TenancyForm({ onCreated, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [propertyOpen, setPropertyOpen] = useState(false);
  const [units, setUnits] = useState<
    { id: string; name: string; type: string }[]
  >([]);
  const [unitOpen, setUnitOpen] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledPropertyId = searchParams.get("propertyId");
  const prefilledUnitId = searchParams.get("unitId");

  const isPropertyLocked = !!prefilledPropertyId;
  const isUnitLocked = !!prefilledUnitId;

  // Auto-open sheet when URL has propertyId or unitId params
  useEffect(() => {
    if (prefilledPropertyId || prefilledUnitId) {
      setOpen(true);
    }
  }, [prefilledPropertyId, prefilledUnitId]);

  // Handle sheet close with URL cleanup
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && (prefilledPropertyId || prefilledUnitId)) {
      // Clear URL params when closing
      router.replace("/tenancies");
    }
  };

  const form = useForm<TenancyFormInput>({
    resolver: zodResolver(TenancySchema) as Resolver<TenancyFormInput>,
    defaultValues: {
      tenantName: "",
      tenantEmail: "",
      tenantPhone: "",
      startDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      annualRent: 0,
      status: "ACTIVE",
      paymentFrequency: "ANNUALLY",
      propertyId: "",
      unitId: "",
      tenantPassportUrl: "",
      // Guarantor fields
      guarantorName: "",
      guarantorPhone: "",
      guarantorEmail: "",
      guarantorAddress: "",
      nextOfKinName: "",
      nextOfKinPhone: "",
      nextOfKinRelationship: "",
      // Tenant Title & Gender for legal documents
      tenantTitle: "",
      tenantGender: "MALE",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    if (open) {
      getPropertiesForSelect().then(setProperties);

      // Handle pre-fill
      if (prefilledPropertyId) {
        form.setValue("propertyId", prefilledPropertyId);
        // Fetch units for pre-filled property
        getPropertyUnits(prefilledPropertyId).then((res) => {
          if (res.success && res.units) {
            setUnits(res.units);
            if (prefilledUnitId) {
              form.setValue("unitId", prefilledUnitId);
            }
          }
        });
      }
    }
  }, [open, prefilledPropertyId, prefilledUnitId, form]);

  async function onSubmit(values: TenancyFormInput) {
    try {
      setSubmitting(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await createTenancy(values as any);
      if (res.success) {
        toast.success("Tenancy created successfully");
        form.reset();
        setOpen(false);
        // Clean URL params after successful creation
        if (prefilledPropertyId || prefilledUnitId) {
          router.replace("/tenancies");
        }
        onCreated?.();
      } else {
        const msg =
          typeof res.message === "string"
            ? res.message
            : "Failed to create tenancy";
        toast.error(msg);
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  const defaultTrigger = (
    <Button className="ml-auto" size="sm">
      Add Tenancy
    </Button>
  );

  const selectedProperty = properties.find(
    (p) => p.id === form.watch("propertyId")
  );

  const selectedUnit = units.find((u) => u.id === form.watch("unitId"));

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{trigger ?? defaultTrigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0"
      >
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Add Tenancy</SheetTitle>
          <SheetDescription>
            Enter lease details. Select property and tenant information.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {/* Property Combobox */}
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Property</FormLabel>
                    <Popover open={propertyOpen} onOpenChange={setPropertyOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isPropertyLocked}
                          >
                            {selectedProperty
                              ? selectedProperty.address
                              : "Select property..."}
                            {isPropertyLocked ? (
                              <Lock
                                className="ml-2 h-4 w-4 shrink-0 opacity-50"
                                aria-label="Pre-selected from Property Page"
                              />
                            ) : (
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      {!isPropertyLocked && (
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search properties..." />
                            <CommandList>
                              <CommandEmpty>No property found.</CommandEmpty>
                              <CommandGroup>
                                {properties.map((property) => (
                                  <CommandItem
                                    key={property.id}
                                    value={property.label}
                                    onSelect={() => {
                                      form.setValue("propertyId", property.id);
                                      // Fetch units when property selected
                                      getPropertyUnits(property.id).then(
                                        (res) => {
                                          if (res.success && res.units) {
                                            setUnits(res.units);
                                            form.setValue("unitId", "");
                                          }
                                        }
                                      );
                                      setPropertyOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        property.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span>{property.address}</span>
                                      <span className="text-xs text-slate-500">
                                        Owner: {property.ownerName}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      )}
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Unit Combobox (Only if property selected and has units) */}
              {units.length > 0 && (
                <FormField
                  control={form.control}
                  name="unitId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Unit (Optional)</FormLabel>
                      <Popover open={unitOpen} onOpenChange={setUnitOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled={isUnitLocked}
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {selectedUnit
                                ? selectedUnit.name
                                : "Select unit..."}
                              {isUnitLocked ? (
                                <Lock
                                  className="ml-2 h-4 w-4 shrink-0 opacity-50"
                                  aria-label="Pre-selected from Property Page"
                                />
                              ) : (
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        {!isUnitLocked && (
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search units..." />
                              <CommandList>
                                <CommandEmpty>No unit found.</CommandEmpty>
                                <CommandGroup>
                                  {units.map((unit) => (
                                    <CommandItem
                                      key={unit.id}
                                      value={unit.name}
                                      onSelect={() => {
                                        form.setValue("unitId", unit.id);
                                        setUnitOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          unit.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {unit.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        )}
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="tenantPassportUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenant Passport Photo</FormLabel>
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
              <FormField
                control={form.control}
                name="tenantName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenant Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tenant Title and Gender Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
                <FormField
                  control={form.control}
                  name="tenantTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenant Title</FormLabel>
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
                  name="tenantGender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenant Gender</FormLabel>
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
                <FormField
                  control={form.control}
                  name="tenantEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenant Email</FormLabel>
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
                  name="tenantPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenant Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="08012345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
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
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expiry Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
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
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="annualRent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Rent (₦)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="2000000.00"
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={field.value || ""}
                        onChange={(e) => {
                          if (e.target.value === "") {
                            field.onChange(undefined);
                          } else {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              field.onChange(val);
                            }
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Frequency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_FREQUENCIES.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value}>
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Guarantor & Next of Kin Section */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium mb-4 text-foreground">
                  Guarantor & Emergency Contact (Optional)
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
                    <FormField
                      control={form.control}
                      name="guarantorName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Guarantor Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Guarantor Name"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="guarantorPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Guarantor Phone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="080..."
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="guarantorAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guarantor Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Full Address"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
                    <FormField
                      control={form.control}
                      name="nextOfKinName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Next of Kin Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Next of Kin Name"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nextOfKinPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Next of Kin Phone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="080..."
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="nextOfKinRelationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Brother"
                            {...field}
                            value={field.value || ""}
                          />
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
                {submitting ? "Saving..." : "Save Tenancy"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
