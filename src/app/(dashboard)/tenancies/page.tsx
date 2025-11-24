import { getTenancies } from "@/server/data/get-tenancies";
import TenanciesTable, { type TenancyRow } from "@/components/tenancies/tenancies-table";

export const dynamic = "force-dynamic";

export default async function TenanciesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const data = await getTenancies();

  const rows: TenancyRow[] = data.map((t) => ({
    id: t.id,
    propertyAddress: t.property.address,
    tenantName: t.tenantName,
    startDate: t.startDate.toISOString(),
    expiryDate: t.expiryDate.toISOString(),
    annualRent: t.annualRent.toString(),
    daysRemaining: t.daysRemaining,
    outstandingBalance: t.outstandingBalance,
    financialStatus: t.financialStatus,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Tenancy Tracking</h1>
      </div>

      <TenanciesTable rows={rows} initialFilter={params.filter} />
    </div>
  );
}
