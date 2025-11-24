import { getClients } from "@/server/data/get-clients";
import ClientsTable, { type ClientRow } from "@/components/clients/clients-table";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const data = await getClients();

  const rows: ClientRow[] = data.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    nin: (c as any).nin ?? null,
    propertyCount: c.propertyCount,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Clients</h1>
      </div>

      <ClientsTable rows={rows} />
    </div>
  );
}
