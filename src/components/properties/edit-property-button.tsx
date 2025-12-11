"use client";

import { useRouter } from "next/navigation";
import PropertyForm from "@/components/properties/property-form";
import type {
  NigerianState,
  TitleType,
  PropertyStructureType,
} from "@prisma/client";

type PropertyData = {
  id: string;
  address: string;
  city: string;
  state: NigerianState;
  titleType: TitleType;
  registrationNumber: string;
  surveyNumber: string | null;
  plotNumber: string | null;
  structureType: PropertyStructureType;
  ownerId: string;
};

type Props = {
  property: PropertyData;
};

export function EditPropertyButton({ property }: Props) {
  const router = useRouter();

  const handleUpdated = () => {
    router.refresh(); // Refresh server data
  };

  return <PropertyForm property={property} onUpdated={handleUpdated} />;
}
