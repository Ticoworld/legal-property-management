"use client";

import { useRouter } from "next/navigation";
import ClientForm from "@/components/clients/client-form";

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
};

type Props = {
  client: ClientData;
};

export function EditClientButton({ client }: Props) {
  const router = useRouter();

  const handleUpdated = () => {
    router.refresh(); // Refresh server data
  };

  return <ClientForm client={client} onUpdated={handleUpdated} />;
}
