-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'CORPORATE');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "gender" "Gender" NOT NULL DEFAULT 'MALE',
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "tenancies" ADD COLUMN     "tenantGender" "Gender" NOT NULL DEFAULT 'MALE',
ADD COLUMN     "tenantTitle" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recoveryKey" TEXT;
