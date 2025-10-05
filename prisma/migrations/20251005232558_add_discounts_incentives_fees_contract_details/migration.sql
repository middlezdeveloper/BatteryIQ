-- AlterTable
ALTER TABLE "public"."energy_plans" ADD COLUMN     "billFrequency" TEXT,
ADD COLUMN     "controlledLoads" TEXT,
ADD COLUMN     "coolingOffDays" INTEGER,
ADD COLUMN     "discounts" TEXT,
ADD COLUMN     "fees" TEXT,
ADD COLUMN     "greenPowerDetails" TEXT,
ADD COLUMN     "incentives" TEXT,
ADD COLUMN     "onExpiryDescription" TEXT,
ADD COLUMN     "paymentOptions" TEXT,
ADD COLUMN     "variationTerms" TEXT;
