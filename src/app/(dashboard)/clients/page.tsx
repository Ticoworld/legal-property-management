import { getClients } from "@/server/data/get-clients";
import ClientsTable, {
  type ClientRow,
} from "@/components/clients/clients-table";
import { getCurrentUser } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const currentUser = await getCurrentUser();
  const data = await getClients();

  const rows: ClientRow[] = data.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    bankName: (c as any).bankName ?? null,
    accountNumber: (c as any).accountNumber ?? null,
    accountName: (c as any).accountName ?? null,
    bvn: (c as any).bvn ?? null,
    passportUrl: (c as any).passportUrl ?? null,
    propertyCount: c.propertyCount,
    verificationStatus: (c as any).verificationStatus,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Clients</h1>
      </div>

      <ClientsTable rows={rows} userRole={currentUser.role} />
    </div>
  );
}
