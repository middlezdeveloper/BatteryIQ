-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "locationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postcode" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "solarZone" INTEGER NOT NULL,
    "gridRegion" TEXT NOT NULL,
    "dmoPricing" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "rebates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "state" TEXT,
    "amount" REAL NOT NULL,
    "maxCapacity" REAL NOT NULL,
    "maxAmount" REAL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requirements" TEXT NOT NULL,
    "vppRequired" BOOLEAN NOT NULL DEFAULT false,
    "vppCapableRequired" BOOLEAN NOT NULL DEFAULT false,
    "declineRate" REAL,
    "budgetLimit" REAL,
    "budgetUsed" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "distributors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "nmiPrefixes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "postcode_distributors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postcode" INTEGER NOT NULL,
    "distributorId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "postcode_distributors_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "distributors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "energy_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "retailerId" TEXT NOT NULL,
    "retailerName" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "fuelType" TEXT NOT NULL,
    "tariffType" TEXT NOT NULL,
    "planType" TEXT NOT NULL DEFAULT 'MARKET',
    "distributors" TEXT NOT NULL,
    "includedPostcodes" TEXT,
    "excludedPostcodes" TEXT,
    "dailySupplyCharge" REAL NOT NULL,
    "peakRate" REAL,
    "peakTimes" TEXT,
    "shoulderRate" REAL,
    "shoulderTimes" TEXT,
    "offPeakRate" REAL,
    "offPeakTimes" TEXT,
    "singleRate" REAL,
    "blockRates" TEXT,
    "demandRate" REAL,
    "demandWindow" TEXT,
    "controlledLoadRate" REAL,
    "feedInTariff" REAL,
    "hasBatteryIncentive" BOOLEAN NOT NULL DEFAULT false,
    "batteryIncentiveValue" REAL,
    "hasVPP" BOOLEAN NOT NULL DEFAULT false,
    "vppCreditPerYear" REAL,
    "payOnTimeDiscount" REAL,
    "directDebitDiscount" REAL,
    "otherDiscounts" TEXT,
    "connectionFee" REAL,
    "disconnectionFee" REAL,
    "latePaymentFee" REAL,
    "paperBillFee" REAL,
    "contractLength" INTEGER,
    "exitFees" REAL,
    "greenPower" BOOLEAN NOT NULL DEFAULT false,
    "carbonNeutral" BOOLEAN NOT NULL DEFAULT false,
    "isEVFriendly" BOOLEAN NOT NULL DEFAULT false,
    "hasPromotions" BOOLEAN NOT NULL DEFAULT false,
    "promotionDetails" JSONB,
    "rawData" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" DATETIME,
    "validTo" DATETIME,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "batteries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "nominalCapacity" REAL NOT NULL,
    "usableCapacity" REAL NOT NULL,
    "powerRating" REAL NOT NULL,
    "maxPowerRating" REAL,
    "efficiency" REAL NOT NULL,
    "warrantyYears" INTEGER NOT NULL,
    "warrantyThroughput" REAL,
    "isVppCapable" BOOLEAN NOT NULL DEFAULT false,
    "price" REAL NOT NULL,
    "installationCost" REAL,
    "maintenance" REAL,
    "chemistry" TEXT NOT NULL,
    "cycles" INTEGER,
    "degradation" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "inverters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "powerRating" REAL NOT NULL,
    "maxDcInput" REAL NOT NULL,
    "efficiency" REAL NOT NULL,
    "phases" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "warrantyYears" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "solar_panels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "powerRating" REAL NOT NULL,
    "efficiency" REAL NOT NULL,
    "technology" TEXT NOT NULL,
    "dimensions" JSONB NOT NULL,
    "price" REAL NOT NULL,
    "warrantyYears" INTEGER NOT NULL,
    "degradation" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "energyPlanId" TEXT,
    "batteryId" TEXT,
    "inverterId" TEXT,
    "solarPanelId" TEXT,
    "batteryCapacity" REAL,
    "solarCapacity" REAL,
    "numberOfPanels" INTEGER,
    "hasExistingSolar" BOOLEAN NOT NULL DEFAULT false,
    "existingSolarSize" REAL,
    "dailyUsage" REAL NOT NULL,
    "peakUsage" REAL,
    "usagePattern" JSONB,
    "essentialLoads" REAL,
    "costWeight" REAL NOT NULL DEFAULT 0.33,
    "emissionsWeight" REAL NOT NULL DEFAULT 0.33,
    "backupWeight" REAL NOT NULL DEFAULT 0.34,
    "lastCalculation" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "projects_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "projects_energyPlanId_fkey" FOREIGN KEY ("energyPlanId") REFERENCES "energy_plans" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "projects_batteryId_fkey" FOREIGN KEY ("batteryId") REFERENCES "batteries" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "projects_inverterId_fkey" FOREIGN KEY ("inverterId") REFERENCES "inverters" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "projects_solarPanelId_fkey" FOREIGN KEY ("solarPanelId") REFERENCES "solar_panels" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "calculations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "userId" TEXT,
    "batteryId" TEXT,
    "batterySize" REAL NOT NULL,
    "solarSize" REAL,
    "scenario" TEXT NOT NULL,
    "totalCost" REAL NOT NULL,
    "federalRebate" REAL NOT NULL,
    "stateRebate" REAL NOT NULL,
    "totalRebates" REAL NOT NULL,
    "netCost" REAL NOT NULL,
    "annualSavings" REAL NOT NULL,
    "paybackYears" REAL NOT NULL,
    "roi" REAL NOT NULL,
    "npv" REAL NOT NULL,
    "irr" REAL NOT NULL,
    "selfConsumption" REAL NOT NULL,
    "exportReduction" REAL NOT NULL,
    "gridImportReduction" REAL NOT NULL,
    "backupHours" REAL NOT NULL,
    "co2Reduction" REAL NOT NULL,
    "co2Lifetime" REAL NOT NULL,
    "peakShaving" REAL NOT NULL,
    "arbitrageSavings" REAL NOT NULL,
    "optimizationStrategy" TEXT NOT NULL,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "calculations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "calculations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "calculations_batteryId_fkey" FOREIGN KEY ("batteryId") REFERENCES "batteries" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "grid_data" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "region" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "price" REAL NOT NULL,
    "demand" REAL NOT NULL,
    "renewableShare" REAL NOT NULL,
    "carbonIntensity" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "seo_data" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "page" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "keywords" TEXT NOT NULL,
    "schemaMarkup" JSONB,
    "locationId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "seo_data_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "category" TEXT,
    "tags" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "schemaMarkup" JSONB,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "installers" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "rating" REAL,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "projectsCompleted" INTEGER NOT NULL DEFAULT 0,
    "yearsExperience" INTEGER,
    "teamSize" INTEGER,
    "specializesIn" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "locations_postcode_key" ON "locations"("postcode");

-- CreateIndex
CREATE INDEX "locations_postcode_idx" ON "locations"("postcode");

-- CreateIndex
CREATE INDEX "locations_state_idx" ON "locations"("state");

-- CreateIndex
CREATE INDEX "locations_solarZone_idx" ON "locations"("solarZone");

-- CreateIndex
CREATE INDEX "rebates_type_state_idx" ON "rebates"("type", "state");

-- CreateIndex
CREATE INDEX "rebates_isActive_idx" ON "rebates"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "distributors_code_key" ON "distributors"("code");

-- CreateIndex
CREATE INDEX "distributors_state_idx" ON "distributors"("state");

-- CreateIndex
CREATE INDEX "distributors_code_idx" ON "distributors"("code");

-- CreateIndex
CREATE INDEX "postcode_distributors_postcode_idx" ON "postcode_distributors"("postcode");

-- CreateIndex
CREATE UNIQUE INDEX "postcode_distributors_postcode_distributorId_key" ON "postcode_distributors"("postcode", "distributorId");

-- CreateIndex
CREATE INDEX "energy_plans_state_planType_isActive_idx" ON "energy_plans"("state", "planType", "isActive");

-- CreateIndex
CREATE INDEX "energy_plans_retailerId_idx" ON "energy_plans"("retailerId");

-- CreateIndex
CREATE INDEX "energy_plans_hasBatteryIncentive_idx" ON "energy_plans"("hasBatteryIncentive");

-- CreateIndex
CREATE INDEX "energy_plans_hasVPP_idx" ON "energy_plans"("hasVPP");

-- CreateIndex
CREATE INDEX "energy_plans_fuelType_idx" ON "energy_plans"("fuelType");

-- CreateIndex
CREATE INDEX "batteries_brand_isActive_idx" ON "batteries"("brand", "isActive");

-- CreateIndex
CREATE INDEX "batteries_isVppCapable_idx" ON "batteries"("isVppCapable");

-- CreateIndex
CREATE INDEX "inverters_brand_isActive_idx" ON "inverters"("brand", "isActive");

-- CreateIndex
CREATE INDEX "solar_panels_brand_isActive_idx" ON "solar_panels"("brand", "isActive");

-- CreateIndex
CREATE INDEX "projects_userId_idx" ON "projects"("userId");

-- CreateIndex
CREATE INDEX "projects_locationId_idx" ON "projects"("locationId");

-- CreateIndex
CREATE INDEX "calculations_projectId_idx" ON "calculations"("projectId");

-- CreateIndex
CREATE INDEX "calculations_userId_idx" ON "calculations"("userId");

-- CreateIndex
CREATE INDEX "calculations_calculatedAt_idx" ON "calculations"("calculatedAt");

-- CreateIndex
CREATE INDEX "grid_data_region_timestamp_idx" ON "grid_data"("region", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "grid_data_region_timestamp_key" ON "grid_data"("region", "timestamp");

-- CreateIndex
CREATE INDEX "seo_data_page_idx" ON "seo_data"("page");

-- CreateIndex
CREATE INDEX "seo_data_locationId_idx" ON "seo_data"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "seo_data_page_path_key" ON "seo_data"("page", "path");

-- CreateIndex
CREATE UNIQUE INDEX "content_slug_key" ON "content"("slug");

-- CreateIndex
CREATE INDEX "content_contentType_isPublished_idx" ON "content"("contentType", "isPublished");

-- CreateIndex
CREATE INDEX "content_category_idx" ON "content"("category");

-- CreateIndex
CREATE INDEX "installers_servicePostcodes_idx" ON "installers"("servicePostcodes");

-- CreateIndex
CREATE INDEX "installers_isVerified_isActive_idx" ON "installers"("isVerified", "isActive");
