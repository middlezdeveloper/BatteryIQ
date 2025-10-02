# BatteryIQ API Integration Journal

> **Purpose:** Daily development log tracking API integrations, data sources, and architectural decisions for the BatteryIQ platform.

---

## 📅 2nd October 2025 - OpenElectricity v4 Integration & Carbon Intensity

### Changes Made
- ✅ Integrated OpenElectricity v4 API for real fuel-tech breakdown by region
- ✅ Added real-time carbon intensity calculations from measured emissions data
- ✅ Replaced BOM weather API with Open-Meteo for reliability
- ✅ Created GridStatusDashboard component with dual data sources
- ✅ Implemented timezone-aware solar generation (0 MW at night)
- ✅ Added Grid Battery charging/discharging state display
- ✅ Combined coal types (black + brown) into single category
- ✅ Separated Solar into Utility and Rooftop line items
- ✅ Made solar persistent (always shows even at 0 MW)

### APIs Integrated
- **OpenElectricity v4**: `https://api.openelectricity.org.au/v4`
  - `/data/network/NEM?metrics=power&primary_grouping=network_region&secondary_grouping=fueltech`
  - `/data/network/NEM?metrics=emissions&primary_grouping=network_region`
  - API Key: `oe_3ZcWbaVvfvsifQu6ePZEehas` (500 calls/day limit)
  - Provides real fuel-tech breakdown by region (VIC1, NSW1, QLD1, SA1, TAS1)
  - Returns battery, coal (black/brown), gas, hydro, solar (utility/rooftop), wind, distillate
  - Emissions data in tonnes per 5-minute interval

- **Open-Meteo**: `https://api.open-meteo.com/v1/forecast`
  - Replaced BOM API for weather and solar irradiance
  - Provides GHI, DNI, DHI solar radiation data
  - Temperature, humidity, cloud cover, wind speed
  - Free, reliable, no authentication required
  - 15-minute caching implemented

### Issues Resolved
- ❌ BOM API 404 errors (station IDN60901) - replaced with Open-Meteo
- ❌ Solar showing at nighttime - fixed with Australia/Sydney timezone awareness
- ❌ Whole-NEM data instead of state-specific - fixed with `primary_grouping=network_region`
- ❌ Renewable calculation using wrong field - fixed to use `solar_total`
- ❌ Battery math incorrect - fixed net calculation (discharging - charging)

### Architecture Decisions
- **Dual Data Sources**:
  - AEMO: Shows consumption mix (what state consumes, includes imports)
  - OpenElectricity: Shows generation mix (what state produces locally)
  - This explains why VIC shows black coal (imported) vs brown coal (local)

- **Carbon Intensity**: Real calculation from emissions
  - Formula: (emissions in kg per 5 min) / (demand in MWh for 5 min)
  - VIC1 showing ~570 kg CO2/MWh currently
  - More accurate than AEMO estimates

- **Caching Strategy**:
  - Weather: 15 minutes (Map-based cache with TTL)
  - OpenElectricity: 5 minutes recommended (not yet implemented)
  - AEMO: Real-time (no cache)

### Performance Notes
- OpenElectricity API: 500 calls/day limit (monitor usage)
- Parallel fetching for power + emissions data
- Using `primary_grouping=network_region` reduces response size
- External IP-based location detection working reliably

### Production Deployments
- ✅ Pushed to GitHub: commit `88cf5e8`
- ✅ Vercel deployment triggered automatically
- 🔗 Live at: https://batteryiq.com.au/grid-status

### Data Quality Notes
- OpenElectricity fuel-tech data is REAL measured generation
- AEMO data is estimates/aggregates (scheduled + semi-scheduled)
- Night-time solar correctly shows 0 MW (6 AM - 7 PM detection)
- Grid battery shows net flow: negative = charging, positive = discharging
- Import/export data not available in fuel-tech endpoint (investigated, not found)

### Next Session Goals
- [ ] Implement caching for OpenElectricity API calls (5-minute TTL)
- [ ] Monitor API usage to stay under 500 calls/day limit
- [ ] Consider adding historical carbon intensity trends
- [ ] Investigate interconnector flow data from alternative sources
- [ ] Add rooftop solar to AEMO section if available
- [ ] Test with all Australian states (NSW, VIC, QLD, SA, TAS)

---

## 📅 2nd October 2025 - Initial API Audit & Documentation

### Current Status Summary

**Project:** BatteryIQ - Solar & battery configurator for Australian homeowners
**Domain:** batteryiq.com.au
**Hosting:** Vercel + Supabase
**Framework:** Next.js 15 (App Router), Prisma, Tailwind CSS

---

## Active API Integrations

### 1. ✅ AEMO (Australian Energy Market Operator)
**Status:** ACTIVE & WORKING
**File:** `src/lib/opennem.ts`
**Endpoint:** `https://visualisations.aemo.com.au/aemo/apps/api/report/ELEC_NEM_SUMMARY`

**What We Get:**
- Real-time wholesale electricity prices ($/MWh)
- Total demand (MW) across all NEM regions
- Scheduled + semi-scheduled generation breakdown
- Renewable share estimation
- Carbon intensity calculation

**Regions Covered:** NSW1, VIC1, QLD1, SA1, TAS1

**Used By:**
- `/api/grid` - Main grid data endpoint
- Homepage grid status dashboard
- Charging recommendations (based on carbon intensity thresholds)

**Data Refresh:** Real-time (5-minute settlement periods)

**Rate Limits:** None known (public AEMO endpoint)

---

### 2. ✅ Bureau of Meteorology (BOM)
**Status:** ACTIVE & WORKING
**File:** `src/lib/bom-solar.ts`
**Endpoint:** `http://reg.bom.gov.au/fwo/{stationId}.json`

**What We Get:**
- Real-time weather observations from nearest station
- Cloud cover (oktas 0-8 scale)
- Air temperature (°C)
- Visibility (km)
- Weather conditions

**What We Calculate:**
- Global Horizontal Irradiance (GHI) - W/m²
- Direct Normal Irradiance (DNI) - W/m²
- Diffuse Horizontal Irradiance - W/m²
- UV Index
- Current solar generation potential

**Weather Stations:**
- Sydney: `IDN60901`
- Melbourne: `IDV60901`
- Brisbane: `IDQ60901`
- Adelaide: `IDS60901`
- Perth: `IDW60901`
- Hobart: `IDT60901`
- Darwin: `IDD60901`
- Canberra: `IDN60903`

**Used By:**
- `/api/solar` - Solar yield calculations
- `/api/debug-bom` - BOM API debugging
- `/api/bom-direct` - Direct BOM data access
- Real-time solar generation estimates

**Caching:** 15-minute TTL per station with coordinate-based cache keys

**Solar Calculations:**
- Solar elevation angle (time/date/location based)
- Clear sky irradiance model
- Cloud reduction factors
- Temperature derating (panels lose 0.4% efficiency per °C above 25°C)

**Rate Limits:** None known (public BOM endpoint)

---

### 3. ⚠️ OpenElectricity API
**Status:** DISABLED (Built but not active)
**File:** `src/lib/openelectricity-api.ts`
**Endpoint:** `https://api.openelectricity.org.au/v4`
**API Key:** `oe_3ZcWbaVvfvsifQu6ePZEehas`

**Why Disabled:**
- Currently using AEMO data for homepage display
- Rate limit concerns (500 calls/day)
- Needs proper caching implementation before re-enabling

**What It Provides:**
- Detailed fuel tech breakdown:
  - Coal (Black/Brown) - separate categories
  - Gas (CCGT, OCGT, Steam, WCMG, Recip) - all gas types
  - Hydro
  - Wind
  - Solar (Utility/Rooftop) - separate categories
  - Battery (Charging/Discharging)
- Real-time pricing data
- Market data across NEM regions

**Capabilities Built:**
- Cache implementation (Map-based with TTL)
- Daily API call counter with automatic midnight reset
- Fuel mix processing with 8 energy source categories
- Carbon intensity calculations from real fuel data
- AEMO distributed PV integration fallback
- Price data extraction and conversion

**Rate Limits:** 500 calls/day (needs smart caching)

**Next Steps:**
- Re-enable with Redis caching layer
- Implement smart refresh schedule
- Use for detailed fuel breakdown on grid dashboard

---

### 4. 🔨 AEMO Distributed Generation API
**Status:** PARTIAL (Fallback estimation in use)
**File:** `src/lib/aemo-distributed-api.ts`
**Endpoint:** `https://visualisations.aemo.com.au/aemo/nemweb/DISPATCHSCADA`

**Purpose:**
- Get rooftop solar PV generation data (missing from OpenElectricity)
- Fill the gap in distributed generation visibility

**Current Implementation:**
- API structure built
- Using time-based fallback estimation
- Estimated rooftop capacity by region:
  - NSW1: 5,000 MW
  - QLD1: 4,500 MW
  - VIC1: 4,000 MW
  - SA1: 2,500 MW
  - TAS1: 500 MW
  - WA1: 2,000 MW

**Solar Factor Calculation:**
- Based on time of day (peak at noon)
- 70% capacity factor on average
- Daytime hours only (6am-6pm)

**Next Steps:**
- Confirm AEMO SCADA endpoint structure
- Parse real distributed PV data
- Replace estimation with real API data

---

### 5. 🔨 OpenNEM API
**Status:** PARTIAL (Time-aware estimation in use)
**File:** `src/lib/opennem-api.ts`
**Endpoint:** `https://api.opennem.org.au`

**Current Implementation:**
- Fuel mapping structure built
- Using time-aware fuel mix estimation
- Regional characteristics defined

**Estimation Model:**
- Solar generation based on time/season
- Regional renewable mix (wind/hydro/battery ratios)
- Regional fossil mix (coal/gas/other ratios)
- Carbon intensity calculation

**Next Steps:**
- Connect to real OpenNEM endpoints
- Replace estimation with actual fuel tech data
- Use as alternative/backup to OpenElectricity

---

### 6. ✅ Solar Zone Calculations
**Status:** ACTIVE
**File:** `src/lib/solar.ts`

**Data Source:** Bureau of Meteorology solar zone maps + Clean Energy Council guidelines

**Solar Zones (1-7):**
- Zone 1: Central Australia (2,300 kWh/m²/year, 6.3 peak sun hours)
- Zone 2: Northern Australia (2,100 kWh/m²/year, 5.8 peak sun hours)
- Zone 3: Brisbane/Perth/Adelaide (1,900 kWh/m²/year, 5.2 peak sun hours)
- Zone 4: Sydney/Melbourne/Canberra (1,700 kWh/m²/year, 4.7 peak sun hours)
- Zone 5: Coastal NSW/VIC (1,500 kWh/m²/year, 4.1 peak sun hours)
- Zone 6: Tasmania/Southern VIC (1,300 kWh/m²/year, 3.6 peak sun hours)
- Zone 7: Southern Tasmania (1,100 kWh/m²/year, 3.0 peak sun hours)

**Capabilities:**
- Annual/monthly solar generation estimates
- STC (Small-scale Technology Certificate) calculations
- Panel tilt/azimuth efficiency adjustments
- Seasonal variation modeling
- Capacity factor calculations

**Used For:**
- Long-term financial projections
- ROI calculations
- STC rebate eligibility
- System sizing recommendations

---

## Database Schema (Prisma + SQLite → Supabase)

### Key Tables Built:

**Hardware Catalog:**
- `Battery` - Capacity, efficiency, VPP capability, warranties
- `Inverter` - Power ratings, efficiency, phases
- `SolarPanel` - Power, degradation, technology types

**Location Intelligence:**
- `Location` - Postcodes with solar zones, grid regions, DMO pricing
- Indexed by postcode, state, solar zone

**Financial Data:**
- `Rebate` - Federal (STC), state programs, VPP incentives
- `EnergyPlan` - DMO/VDO pricing, TOU tariffs, feed-in tariffs
- `Calculation` - ROI, payback, NPV, IRR results

**Grid Data:**
- `GridData` - Real-time price, demand, renewable share, carbon intensity
- Historical tracking with timestamp indexing

**Content & SEO:**
- `SEOData` - Dynamic SEO per location
- `Content` - Blog/guides/FAQs (markdown-based)
- `Installer` - Installer directory (not yet implemented)

---

## API Routes Built

```
/api/grid               - Current grid mix & carbon intensity (AEMO)
/api/locations          - Location/postcode lookup
/api/tariffs            - Energy plan pricing
/api/rebates            - Federal/state rebate data
/api/solar              - Solar generation calculations
/api/location           - IP-based geolocation
/api/bom-direct         - Bureau of Meteorology direct access
/api/clear-cache        - Cache management
/api/debug-bom          - BOM debugging endpoint
/api/grid-enhanced      - Enhanced grid data
/api/raw-data           - Raw data debugging
/api/test-openelectricity - OpenElectricity API testing
```

---

## Key Data Flows

### Homepage Grid Display
1. IP-based geolocation determines user region
2. Fetch AEMO data for their NEM region
3. Calculate carbon intensity from renewable share
4. Display real-time renewable %, carbon intensity, wholesale price
5. Provide charging recommendation (charge/hold/discharge)

### Solar Yield Estimation
**Two-tier approach:**

**Long-term (Financial):**
- Use static solar zones (1-7)
- Clean Energy Council guidelines
- Annual/monthly averages
- STC rebate calculations

**Real-time (Monitoring):**
- BOM weather data (cloud cover, temp)
- Calculated solar irradiance (GHI/DNI)
- Temperature derating
- Current generation estimates

### Battery Optimization
1. User's daily usage pattern
2. Current grid pricing (AEMO)
3. Carbon intensity
4. Energy plan tariff structure (TOU)
5. Calculate optimal charge/discharge schedule
6. Show ROI, payback period, NPV

---

## Carbon Intensity Thresholds

**Defined in:** `src/lib/opennem.ts`

```typescript
VERY_CLEAN:  < 100 kg CO2/MWh  → Charge batteries
CLEAN:       < 300 kg CO2/MWh  → Normal operation
MODERATE:    < 600 kg CO2/MWh  → Consider discharge
DIRTY:       < 800 kg CO2/MWh  → Maximize discharge
VERY_DIRTY:  > 800 kg CO2/MWh  → Full discharge mode
```

---

## Regional Characteristics

### Fossil Fuel Mix (when renewables low):
```typescript
NSW1: 60% coal, 35% gas, 5% other
VIC1: 80% coal, 15% gas, 5% other (high brown coal)
QLD1: 70% coal, 25% gas, 5% other
SA1:  10% coal, 80% gas, 10% other
TAS1: 0% coal, 10% gas, 90% hydro
```

### Renewable Mix (non-solar):
```typescript
NSW1: 40% wind, 50% hydro, 10% battery
VIC1: 60% wind, 30% hydro, 10% battery
QLD1: 30% wind, 60% hydro, 10% battery
SA1:  70% wind, 20% hydro, 10% battery
TAS1: 20% wind, 80% hydro, minimal battery
```

---

## Technical Stack

**Frontend:**
- Next.js 15 (App Router, Turbopack)
- React 19
- Tailwind CSS
- Framer Motion
- Radix UI components

**Backend:**
- Prisma ORM
- SQLite (dev) → Supabase (production)
- Redis caching
- Next.js API routes

**Deployment:**
- Vercel (hosting)
- Supabase (database)
- Domain: batteryiq.com.au

**Dependencies:**
- `@prisma/client` - Database ORM
- `@supabase/supabase-js` - Supabase client
- `redis` - Caching layer
- `next-seo` - SEO optimization

---

## Known Issues & Technical Debt

### 1. OpenElectricity Integration
- Built but disabled
- Needs Redis-backed caching before production use
- 500 calls/day limit requires smart refresh strategy

### 2. AEMO Distributed PV
- Using estimated data instead of real API
- Need to confirm SCADA endpoint structure
- Fallback estimation is conservative

### 3. OpenNEM API
- Structure built but not hitting real endpoints
- Time-aware estimation in place
- Should integrate as backup to OpenElectricity

### 4. Features Not Yet Built
- User authentication/sessions
- Project saving/management
- Installer directory matching
- Content management (blog)
- Historical grid visualization
- VPP program integration

---

## Recommended Next Steps

### Immediate Priorities:
1. **Re-enable OpenElectricity** with proper Redis caching
   - Implement request queue
   - Smart refresh schedule
   - Monitor daily API usage

2. **AEMO Distributed PV Integration**
   - Confirm SCADA data structure
   - Replace estimations with real data
   - Add to grid dashboard

3. **Caching Layer Enhancement**
   - Move from Map-based to Redis
   - Implement stale-while-revalidate pattern
   - Add cache warming for common requests

### Future Enhancements:
4. OpenNEM as fallback data source
5. Historical grid data visualization
6. User authentication & project saving
7. Installer directory
8. VPP program integration

---

## Development Commands

### Run development server:
```bash
npm run dev
```

### Build for production:
```bash
npm run build:prod
```

### Generate Prisma client:
```bash
npx prisma generate
```

### Deploy to Vercel:
```bash
npx vercel --prod
```

---

## Daily Update Command

To update this journal after significant changes:

```bash
# Manual update reminder
echo "Remember to update Docs/API-Integration-Journal.md with today's changes!"
```

Add a section with today's date and document:
- API changes made
- New integrations added
- Issues discovered
- Performance improvements
- Rate limit observations
- Production deployments

---

## Changelog Template

```markdown
## 📅 [DATE] - [Brief Summary]

### Changes Made
- [List of changes]

### APIs Modified
- [Which API integrations were updated]

### Issues Resolved
- [Bugs fixed]

### Issues Discovered
- [New problems found]

### Performance Notes
- [API usage, caching improvements, etc.]

### Production Deployments
- [If pushed to production]

### Next Session Goals
- [What to tackle next]

---
```

---

**Last Updated:** 2nd October 2025
**Next Review:** After next production deployment
