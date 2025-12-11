import { getTenancies } from "@/server/data/get-tenancies";
import TenanciesTable, {
  type TenancyRow,
} from "@/components/tenancies/tenancies-table";

import { getCurrentUser } from "@/lib/auth-helper";

// ... previous imports ...

export const dynamic = "force-dynamic";

export default async function TenanciesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const currentUser = await getCurrentUser();
  const params = await searchParams;
  const data = await getTenancies();

  const rows: TenancyRow[] = data.map((t) => ({
    id: t.id,
    propertyAddress: t.property.address,
    propertyCity: t.property.city,
    propertyState: t.property.state,
    landlordFirstName: t.property.owner.firstName,
    landlordLastName: t.property.owner.lastName,
    unitName: t.unit?.name,
    unitType: t.unit?.type,
    paymentFrequency: t.paymentFrequency,
    tenantName: t.tenantName,
    startDate: t.startDate.toISOString(),
    expiryDate: t.expiryDate.toISOString(),
    annualRent: t.annualRent.toString(),
    daysRemaining: t.daysRemaining,
    outstandingBalance: t.outstandingBalance,
    totalExpenses: t.totalExpenses,
    financialStatus: t.financialStatus,
    tenantPassportUrl: t.tenantPassportUrl,
    verificationStatus: t.verificationStatus,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">
          Tenancy Tracking
        </h1>
      </div>

      <TenanciesTable
        rows={rows}
        initialFilter={params.filter}
        userRole={currentUser.role}
      />
    </div>
  );
}
