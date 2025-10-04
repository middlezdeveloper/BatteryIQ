-- CreateEnum
CREATE TYPE "public"."RebateType" AS ENUM ('FEDERAL', 'STATE', 'UTILITY', 'LOCAL');

-- CreateEnum
CREATE TYPE "public"."TariffType" AS ENUM ('FLAT', 'TIME_OF_USE', 'DEMAND', 'BLOCK');

-- CreateEnum
CREATE TYPE "public"."PlanType" AS ENUM ('DMO', 'VDO', 'MARKET', 'STANDING');

-- CreateEnum
CREATE TYPE "public"."BatteryChemistry" AS ENUM ('LITHIUM_ION', 'LITHIUM_PHOSPHATE', 'LEAD_ACID', 'FLOW_BATTERY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."PanelTechnology" AS ENUM ('MONOCRYSTALLINE', 'POLYCRYSTALLINE', 'THIN_FILM', 'BIFACIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ContentType" AS ENUM ('BLOG', 'GUIDE', 'FAQ', 'CASE_STUDY', 'NEWS', 'LANDING_PAGE');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."locations" (
    "id" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "solarZone" INTEGER NOT NULL,
    "gridRegion" TEXT NOT NULL,
    "dmoPricing" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rebates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."RebateType" NOT NULL,
    "state" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "maxCapacity" DOUBLE PRECISION NOT NULL,
    "maxAmount" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requirements" TEXT NOT NULL,
    "vppRequired" BOOLEAN NOT NULL DEFAULT false,
    "vppCapableRequired" BOOLEAN NOT NULL DEFAULT false,
    "declineRate" DOUBLE PRECISION,
    "budgetLimit" DOUBLE PRECISION,
    "budgetUsed" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rebates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."distributors" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "nmiPrefixes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distributors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."postcode_distributors" (
    "id" TEXT NOT NULL,
    "postcode" INTEGER NOT NULL,
    "distributorId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postcode_distributors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."energy_plans" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "retailerName" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "fuelType" TEXT NOT NULL,
    "tariffType" "public"."TariffType" NOT NULL,
    "planType" "public"."PlanType" NOT NULL DEFAULT 'MARKET',
    "distributors" TEXT NOT NULL,
    "includedPostcodes" TEXT,
    "excludedPostcodes" TEXT,
    "dailySupplyCharge" DOUBLE PRECISION NOT NULL,
    "peakRate" DOUBLE PRECISION,
    "peakTimes" TEXT,
    "shoulderRate" DOUBLE PRECISION,
    "shoulderTimes" TEXT,
    "offPeakRate" DOUBLE PRECISION,
    "offPeakTimes" TEXT,
    "singleRate" DOUBLE PRECISION,
    "blockRates" TEXT,
    "demandRate" DOUBLE PRECISION,
    "demandWindow" TEXT,
    "controlledLoadRate" DOUBLE PRECISION,
    "feedInTariff" DOUBLE PRECISION,
    "hasBatteryIncentive" BOOLEAN NOT NULL DEFAULT false,
    "batteryIncentiveValue" DOUBLE PRECISION,
    "hasVPP" BOOLEAN NOT NULL DEFAULT false,
    "vppCreditPerYear" DOUBLE PRECISION,
    "payOnTimeDiscount" DOUBLE PRECISION,
    "directDebitDiscount" DOUBLE PRECISION,
    "otherDiscounts" TEXT,
    "connectionFee" DOUBLE PRECISION,
    "disconnectionFee" DOUBLE PRECISION,
    "latePaymentFee" DOUBLE PRECISION,
    "paperBillFee" DOUBLE PRECISION,
    "contractLength" INTEGER,
    "exitFees" DOUBLE PRECISION,
    "greenPower" BOOLEAN NOT NULL DEFAULT false,
    "carbonNeutral" BOOLEAN NOT NULL DEFAULT false,
    "isEVFriendly" BOOLEAN NOT NULL DEFAULT false,
    "hasPromotions" BOOLEAN NOT NULL DEFAULT false,
    "promotionDetails" JSONB,
    "rawData" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "energy_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."batteries" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "nominalCapacity" DOUBLE PRECISION NOT NULL,
    "usableCapacity" DOUBLE PRECISION NOT NULL,
    "powerRating" DOUBLE PRECISION NOT NULL,
    "maxPowerRating" DOUBLE PRECISION,
    "efficiency" DOUBLE PRECISION NOT NULL,
    "warrantyYears" INTEGER NOT NULL,
    "warrantyThroughput" DOUBLE PRECISION,
    "isVppCapable" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION NOT NULL,
    "installationCost" DOUBLE PRECISION,
    "maintenance" DOUBLE PRECISION,
    "chemistry" "public"."BatteryChemistry" NOT NULL,
    "cycles" INTEGER,
    "degradation" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batteries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inverters" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "powerRating" DOUBLE PRECISION NOT NULL,
    "maxDcInput" DOUBLE PRECISION NOT NULL,
    "efficiency" DOUBLE PRECISION NOT NULL,
    "phases" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "warrantyYears" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inverters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."solar_panels" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "powerRating" DOUBLE PRECISION NOT NULL,
    "efficiency" DOUBLE PRECISION NOT NULL,
    "technology" "public"."PanelTechnology" NOT NULL,
    "dimensions" JSONB NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "warrantyYears" INTEGER NOT NULL,
    "degradation" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solar_panels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."projects" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "energyPlanId" TEXT,
    "batteryId" TEXT,
    "inverterId" TEXT,
    "solarPanelId" TEXT,
    "batteryCapacity" DOUBLE PRECISION,
    "solarCapacity" DOUBLE PRECISION,
    "numberOfPanels" INTEGER,
    "hasExistingSolar" BOOLEAN NOT NULL DEFAULT false,
    "existingSolarSize" DOUBLE PRECISION,
    "dailyUsage" DOUBLE PRECISION NOT NULL,
    "peakUsage" DOUBLE PRECISION,
    "usagePattern" JSONB,
    "essentialLoads" DOUBLE PRECISION,
    "costWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.33,
    "emissionsWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.33,
    "backupWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.34,
    "lastCalculation" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."calculations" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT,
    "batteryId" TEXT,
    "batterySize" DOUBLE PRECISION NOT NULL,
    "solarSize" DOUBLE PRECISION,
    "scenario" TEXT NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "federalRebate" DOUBLE PRECISION NOT NULL,
    "stateRebate" DOUBLE PRECISION NOT NULL,
    "totalRebates" DOUBLE PRECISION NOT NULL,
    "netCost" DOUBLE PRECISION NOT NULL,
    "annualSavings" DOUBLE PRECISION NOT NULL,
    "paybackYears" DOUBLE PRECISION NOT NULL,
    "roi" DOUBLE PRECISION NOT NULL,
    "npv" DOUBLE PRECISION NOT NULL,
    "irr" DOUBLE PRECISION NOT NULL,
    "selfConsumption" DOUBLE PRECISION NOT NULL,
    "exportReduction" DOUBLE PRECISION NOT NULL,
    "gridImportReduction" DOUBLE PRECISION NOT NULL,
    "backupHours" DOUBLE PRECISION NOT NULL,
    "co2Reduction" DOUBLE PRECISION NOT NULL,
    "co2Lifetime" DOUBLE PRECISION NOT NULL,
    "peakShaving" DOUBLE PRECISION NOT NULL,
    "arbitrageSavings" DOUBLE PRECISION NOT NULL,
    "optimizationStrategy" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."grid_data" (
    "id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "demand" DOUBLE PRECISION NOT NULL,
    "renewableShare" DOUBLE PRECISION NOT NULL,
    "carbonIntensity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "grid_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."seo_data" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "keywords" TEXT NOT NULL,
    "schemaMarkup" JSONB,
    "locationId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."content" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "contentType" "public"."ContentType" NOT NULL,
    "category" TEXT,
    "tags" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "schemaMarkup" JSONB,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."installers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "abn" TEXT,
    "cleanEnergyCouncilId" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "address" JSONB NOT NULL,
    "servicePostcodes" TEXT NOT NULL,
    "serviceRadius" INTEGER,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "cetcAccredited" BOOLEAN NOT NULL DEFAULT false,
    "gridConnectApproved" BOOLEAN NOT NULL DEFAULT false,
    "insuranceValid" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "projectsCompleted" INTEGER NOT NULL DEFAULT 0,
    "yearsExperience" INTEGER,
    "teamSize" INTEGER,
    "specializesIn" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "locations_postcode_key" ON "public"."locations"("postcode");

-- CreateIndex
CREATE INDEX "locations_postcode_idx" ON "public"."locations"("postcode");

-- CreateIndex
CREATE INDEX "locations_state_idx" ON "public"."locations"("state");

-- CreateIndex
CREATE INDEX "locations_solarZone_idx" ON "public"."locations"("solarZone");

-- CreateIndex
CREATE INDEX "rebates_type_state_idx" ON "public"."rebates"("type", "state");

-- CreateIndex
CREATE INDEX "rebates_isActive_idx" ON "public"."rebates"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "distributors_code_key" ON "public"."distributors"("code");

-- CreateIndex
CREATE INDEX "distributors_state_idx" ON "public"."distributors"("state");

-- CreateIndex
CREATE INDEX "distributors_code_idx" ON "public"."distributors"("code");

-- CreateIndex
CREATE INDEX "postcode_distributors_postcode_idx" ON "public"."postcode_distributors"("postcode");

-- CreateIndex
CREATE UNIQUE INDEX "postcode_distributors_postcode_distributorId_key" ON "public"."postcode_distributors"("postcode", "distributorId");

-- CreateIndex
CREATE INDEX "energy_plans_state_planType_isActive_idx" ON "public"."energy_plans"("state", "planType", "isActive");

-- CreateIndex
CREATE INDEX "energy_plans_retailerId_idx" ON "public"."energy_plans"("retailerId");

-- CreateIndex
CREATE INDEX "energy_plans_hasBatteryIncentive_idx" ON "public"."energy_plans"("hasBatteryIncentive");

-- CreateIndex
CREATE INDEX "energy_plans_hasVPP_idx" ON "public"."energy_plans"("hasVPP");

-- CreateIndex
CREATE INDEX "energy_plans_fuelType_idx" ON "public"."energy_plans"("fuelType");

-- CreateIndex
CREATE INDEX "batteries_brand_isActive_idx" ON "public"."batteries"("brand", "isActive");

-- CreateIndex
CREATE INDEX "batteries_isVppCapable_idx" ON "public"."batteries"("isVppCapable");

-- CreateIndex
CREATE INDEX "inverters_brand_isActive_idx" ON "public"."inverters"("brand", "isActive");

-- CreateIndex
CREATE INDEX "solar_panels_brand_isActive_idx" ON "public"."solar_panels"("brand", "isActive");

-- CreateIndex
CREATE INDEX "projects_userId_idx" ON "public"."projects"("userId");

-- CreateIndex
CREATE INDEX "projects_locationId_idx" ON "public"."projects"("locationId");

-- CreateIndex
CREATE INDEX "calculations_projectId_idx" ON "public"."calculations"("projectId");

-- CreateIndex
CREATE INDEX "calculations_userId_idx" ON "public"."calculations"("userId");

-- CreateIndex
CREATE INDEX "calculations_calculatedAt_idx" ON "public"."calculations"("calculatedAt");

-- CreateIndex
CREATE INDEX "grid_data_region_timestamp_idx" ON "public"."grid_data"("region", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "grid_data_region_timestamp_key" ON "public"."grid_data"("region", "timestamp");

-- CreateIndex
CREATE INDEX "seo_data_page_idx" ON "public"."seo_data"("page");

-- CreateIndex
CREATE INDEX "seo_data_locationId_idx" ON "public"."seo_data"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "seo_data_page_path_key" ON "public"."seo_data"("page", "path");

-- CreateIndex
CREATE UNIQUE INDEX "content_slug_key" ON "public"."content"("slug");

-- CreateIndex
CREATE INDEX "content_contentType_isPublished_idx" ON "public"."content"("contentType", "isPublished");

-- CreateIndex
CREATE INDEX "content_category_idx" ON "public"."content"("category");

-- CreateIndex
CREATE INDEX "installers_servicePostcodes_idx" ON "public"."installers"("servicePostcodes");

-- CreateIndex
CREATE INDEX "installers_isVerified_isActive_idx" ON "public"."installers"("isVerified", "isActive");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."postcode_distributors" ADD CONSTRAINT "postcode_distributors_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "public"."distributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_energyPlanId_fkey" FOREIGN KEY ("energyPlanId") REFERENCES "public"."energy_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_batteryId_fkey" FOREIGN KEY ("batteryId") REFERENCES "public"."batteries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_inverterId_fkey" FOREIGN KEY ("inverterId") REFERENCES "public"."inverters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_solarPanelId_fkey" FOREIGN KEY ("solarPanelId") REFERENCES "public"."solar_panels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."calculations" ADD CONSTRAINT "calculations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."calculations" ADD CONSTRAINT "calculations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."calculations" ADD CONSTRAINT "calculations_batteryId_fkey" FOREIGN KEY ("batteryId") REFERENCES "public"."batteries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."seo_data" ADD CONSTRAINT "seo_data_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
