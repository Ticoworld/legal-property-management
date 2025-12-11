"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import type { PropertyUnitConfig } from "@/types/schema";

const UNIT_TYPES = [
  { value: "ROOM_PARLOUR", label: "Room & Parlour" },
  { value: "SELF_CONTAIN", label: "Self Contain" },
  { value: "ONE_BEDROOM", label: "1 Bedroom" },
  { value: "TWO_BEDROOM", label: "2 Bedroom" },
  { value: "THREE_BEDROOM", label: "3 Bedroom" },
  { value: "FOUR_BEDROOM", label: "4 Bedroom" },
  { value: "DUPLEX", label: "Duplex" },
  { value: "SHOP", label: "Shop" },
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "PLOT_OF_LAND", label: "Plot of Land" },
  { value: "OFFICE", label: "Office" },
] as const;

type UnitConfig = {
  id: string;
  type: string;
  quantity: number;
  marketRent?: number;
};

type Props = {
  value: PropertyUnitConfig[];
  onChange: (units: PropertyUnitConfig[]) => void;
  structureType?: string;
};

export function UnitGenerator({ value, onChange, structureType }: Props) {
  const [units, setUnits] = useState<UnitConfig[]>(
    value.length > 0
      ? value.map((u, i) => ({
          id: `unit-${i}`,
          type: u.type,
          quantity: u.quantity,
          marketRent: u.marketRent,
        }))
      : [{ id: "unit-0", type: "", quantity: 1 }]
  );

  const addUnit = () => {
    const newUnit: UnitConfig = {
      id: `unit-${Date.now()}`,
      type: "",
      quantity: 1,
    };
    const updatedUnits = [...units, newUnit];
    setUnits(updatedUnits);
  };

  const removeUnit = (id: string) => {
    const updatedUnits = units.filter((u) => u.id !== id);
    setUnits(updatedUnits);
    updateParent(updatedUnits);
  };

  const updateUnit = (
    id: string,
    field: keyof UnitConfig,
    value: string | number | undefined
  ) => {
    const updatedUnits = units.map((u) => {
      if (u.id === id) {
        return { ...u, [field]: value };
      }
      return u;
    });
    setUnits(updatedUnits);
    updateParent(updatedUnits);
  };

  const updateParent = (currentUnits: UnitConfig[]) => {
    // Filter out incomplete units and convert to PropertyUnitConfig
    const validUnits = currentUnits
      .filter((u) => u.type && u.quantity > 0)
      .map((u) => ({
        type: u.type as PropertyUnitConfig["type"],
        quantity: u.quantity,
        marketRent: u.marketRent,
      }));
    onChange(validUnits);
  };

  const totalUnits = units.reduce((sum, u) => sum + (u.quantity || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base">Unit Configuration</Label>
        <Button type="button" variant="outline" size="sm" onClick={addUnit}>
          <Plus className="mr-2 h-4 w-4" />
          Add Unit Type
        </Button>
      </div>

      <div className="space-y-3">
        {units.map((unit) => (
          <Card key={unit.id} className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1.5fr_auto] gap-3 items-start">
              {/* Unit Type */}
              <div className="space-y-2">
                <Label className="text-xs">Unit Type</Label>
                <Select
                  value={unit.type}
                  onValueChange={(value) => updateUnit(unit.id, "type", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_TYPES.filter((type) => {
                      if (structureType === "LAND") {
                        return type.value === "PLOT_OF_LAND";
                      }
                      if (structureType === "SHOPPING_COMPLEX") {
                        return ["SHOP", "OFFICE", "WAREHOUSE"].includes(
                          type.value
                        );
                      }
                      if (
                        ["BLOCK_OF_FLATS", "ESTATE", "SINGLE_UNIT"].includes(
                          structureType || ""
                        )
                      ) {
                        return [
                          "ROOM_PARLOUR",
                          "SELF_CONTAIN",
                          "ONE_BEDROOM",
                          "TWO_BEDROOM",
                          "THREE_BEDROOM",
                          "FOUR_BEDROOM",
                          "DUPLEX",
                          "SHOP",
                          "OFFICE",
                        ].includes(type.value);
                      }
                      return type.value !== "PLOT_OF_LAND";
                    }).map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label className="text-xs">
                  {structureType === "LAND" ? "Number of Plots" : "Quantity"}
                </Label>
                <Input
                  type="number"
                  max="100"
                  value={unit.quantity || ""}
                  onChange={(e) => {
                    if (e.target.value === "") {
                      updateUnit(unit.id, "quantity", 0);
                    } else {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 0) {
                        updateUnit(unit.id, "quantity", val);
                      }
                    }
                  }}
                  placeholder="1"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {/* Market Rent (Optional) */}
              <div className="space-y-2">
                <Label className="text-xs">Market Rent (₦)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={unit.marketRent || ""}
                  onChange={(e) => {
                    if (e.target.value === "") {
                      updateUnit(unit.id, "marketRent", undefined);
                    } else {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val >= 0) {
                        updateUnit(unit.id, "marketRent", val);
                      }
                    }
                  }}
                  placeholder="Optional"
                />
              </div>

              {/* Delete Button */}
              {units.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeUnit(unit.id)}
                  className="shrink-0 self-end mb-0.5"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Preview Summary */}
      {totalUnits > 0 && (
        <div className="rounded-lg bg-muted p-4 text-sm">
          <p className="font-medium">
            Total Units: <span className="text-primary">{totalUnits}</span>
          </p>
          <p className="text-muted-foreground mt-1">
            This will generate {totalUnits} individual{" "}
            {structureType === "LAND" ? "plot" : "unit"}
            {totalUnits !== 1 ? "s" : ""} with smart naming
            {totalUnits <= 3 ? ": " : "."}
            {totalUnits <= 3 &&
              units
                .filter((u) => u.type && u.quantity > 0)
                .map((u) => {
                  const typeName =
                    UNIT_TYPES.find((t) => t.value === u.type)?.label || u.type;
                  return `${u.quantity}x ${typeName}`;
                })
                .join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}
