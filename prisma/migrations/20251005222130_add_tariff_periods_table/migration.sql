-- AlterTable
ALTER TABLE "public"."energy_plans" ADD COLUMN     "coverageGaps" TEXT,
ADD COLUMN     "coverageOverlaps" TEXT,
ADD COLUMN     "has24HourCoverage" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."tariff_periods" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "timeWindows" JSONB NOT NULL,
    "sequenceOrder" INTEGER NOT NULL,
    "period" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tariff_periods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tariff_periods_planId_idx" ON "public"."tariff_periods"("planId");

-- CreateIndex
CREATE INDEX "tariff_periods_planId_sequenceOrder_idx" ON "public"."tariff_periods"("planId", "sequenceOrder");

-- AddForeignKey
ALTER TABLE "public"."tariff_periods" ADD CONSTRAINT "tariff_periods_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."energy_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
