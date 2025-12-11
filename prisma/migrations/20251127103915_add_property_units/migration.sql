-- CreateEnum
CREATE TYPE "PropertyStructureType" AS ENUM ('SINGLE_UNIT', 'BLOCK_OF_FLATS', 'SHOPPING_COMPLEX', 'ESTATE', 'LAND');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('ROOM_PARLOUR', 'SELF_CONTAIN', 'ONE_BEDROOM', 'TWO_BEDROOM', 'THREE_BEDROOM', 'FOUR_BEDROOM', 'DUPLEX', 'SHOP', 'WAREHOUSE', 'PLOT_OF_LAND', 'OFFICE');

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "structureType" "PropertyStructureType" NOT NULL DEFAULT 'SINGLE_UNIT';

-- AlterTable
ALTER TABLE "tenancies" ADD COLUMN     "unitId" TEXT;

-- CreateTable
CREATE TABLE "property_units" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "UnitType" NOT NULL,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "marketRent" DECIMAL(15,2),
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "property_units_propertyId_idx" ON "property_units"("propertyId");

-- CreateIndex
CREATE INDEX "property_units_type_idx" ON "property_units"("type");

-- CreateIndex
CREATE INDEX "tenancies_unitId_idx" ON "tenancies"("unitId");

-- AddForeignKey
ALTER TABLE "property_units" ADD CONSTRAINT "property_units_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "property_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
