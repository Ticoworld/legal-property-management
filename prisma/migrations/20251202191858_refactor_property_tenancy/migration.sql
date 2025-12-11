/*
  Warnings:

  - The values [CERTIFICATE_OF_OCCUPANCY,DEED_OF_ASSIGNMENT,DEED_OF_CONVEYANCE,GOVERNORS_CONSENT,REGISTERED_CONVEYANCE,POWER_OF_ATTORNEY] on the enum `TitleType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `propertyType` on the `properties` table. All the data in the column will be lost.
  - The `paymentFrequency` column on the `tenancies` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PaymentFrequency" AS ENUM ('ANNUALLY', 'BI_ANNUALLY', 'QUARTERLY', 'MONTHLY');

-- AlterEnum
BEGIN;
CREATE TYPE "TitleType_new" AS ENUM ('IRREVOCABLE_POWER_OF_ATTORNEY', 'OTHER');
ALTER TABLE "properties" ALTER COLUMN "titleType" TYPE "TitleType_new" USING ("titleType"::text::"TitleType_new");
ALTER TYPE "TitleType" RENAME TO "TitleType_old";
ALTER TYPE "TitleType_new" RENAME TO "TitleType";
DROP TYPE "public"."TitleType_old";
COMMIT;

-- AlterTable
ALTER TABLE "properties" DROP COLUMN "propertyType";

-- AlterTable
ALTER TABLE "tenancies" DROP COLUMN "paymentFrequency",
ADD COLUMN     "paymentFrequency" "PaymentFrequency" DEFAULT 'ANNUALLY';

-- DropEnum
DROP TYPE "PropertyType";
