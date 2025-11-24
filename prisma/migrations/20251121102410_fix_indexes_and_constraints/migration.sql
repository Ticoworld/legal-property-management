-- DropForeignKey
ALTER TABLE "tenancies" DROP CONSTRAINT "tenancies_propertyId_fkey";

-- CreateIndex
CREATE INDEX "clients_phone_idx" ON "clients"("phone");

-- CreateIndex
CREATE INDEX "tenancies_tenantName_idx" ON "tenancies"("tenantName");

-- AddForeignKey
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
