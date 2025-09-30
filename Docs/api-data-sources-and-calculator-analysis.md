# BatteryIQ API Data Sources & Calculator Analysis

*Understanding what data we have, where it comes from, and how our calculator works*

## Overview

This document explains the current state of BatteryIQ's data sources and calculator functionality. Think of this as the "data blueprint" that powers our battery recommendations - what information we can access, what we're missing, and how everything connects together.

---

## 1. API Integrations & Data Sources

### 🌤️ Bureau of Meteorology (BOM) Weather API

**What it is:** Australia's official weather service providing real-time solar and weather conditions.

**What data we get:**
- **Solar irradiance**: How much sunlight is hitting solar panels right now (measured in watts per square meter)
- **Cloud cover**: Percentage of sky covered by clouds (affects solar generation)
- **Temperature**: Current air temperature (hot panels generate less electricity)
- **UV index**: Strength of UV radiation (correlates with solar generation)
- **Visibility**: How clear the air is (haze/pollution reduces solar output)

**Is it live or historical?**
- ✅ **Live data only** - updated every 15 minutes
- ❌ **No historical data** - we can't look back at past weather patterns
- 🔄 **15-minute cache** - we store recent data briefly to avoid overwhelming their servers

**What we use it for:**
- Making solar generation estimates more accurate based on current weather
- Telling users if today is a "good solar day" or "cloudy solar day"
- Adjusting battery charging recommendations based on expected solar output

**Limitations:**
- Can't predict next week's weather for planning
- No seasonal patterns or monthly averages
- Sometimes unavailable (government servers go down)

---

### ⚡ AEMO/OpenNEM Grid Data API

**What it is:** Real-time information about Australia's electricity grid - what's generating power, how much it costs, and how clean it is.

**What data we get:**
- **Wholesale electricity prices**: What power companies pay for electricity right now ($/MWh)
- **Renewable percentage**: How much of the grid is currently powered by renewables
- **Carbon intensity**: How much CO2 pollution each kWh of grid electricity creates
- **Energy demand**: How much electricity Australia is using right now
- **Fuel mix**: What percentage is coal, gas, solar, wind, etc.

**Is it live or historical?**
- ✅ **Live data** - updated every 5 minutes
- ✅ **Some historical data available** - OpenNEM has years of historical data we could tap into
- 🔄 **Current implementation**: We only use live data, not historical trends

**What we use it for:**
- Calculating how much money users can save with "energy arbitrage" (buy cheap, use expensive)
- Showing environmental benefits of batteries
- Optimizing when to charge/discharge batteries for maximum savings

**Opportunity:**
- **Historical data goldmine**: We could analyze patterns like "electricity is usually cheapest at 2am on weekdays" or "prices spike during summer heatwaves"

---

### 📊 DMO/VDO Tariff Database (Our Own Database)

**What it is:** Official electricity prices set by government regulators - the "default" rates that power companies must offer.

**What data we have stored:**
- **Default Market Offer (DMO)**: Government-set rates for NSW, Queensland, South Australia
- **Victorian Default Offer (VDO)**: Government-set rates for Victoria
- **Time-of-use schedules**: When peak/off-peak rates apply
- **Supply charges**: Daily connection fees
- **Feed-in tariffs**: How much you get paid for excess solar
- **EV-friendly tariffs**: Special rates for electric vehicle charging

**Is it live or historical?**
- 📁 **Static data** - we've built our own database with current official rates
- 🔄 **Updated annually** - government updates these rates once per year
- ✅ **Comprehensive coverage** - all major electricity distributors in regulated states

**What we use it for:**
- Calculating real savings (not just estimates)
- Comparing current bills to optimized tariffs
- Working out battery arbitrage opportunities with actual price differences
- Determining if users should switch electricity plans

**Why this is valuable:**
- Most calculators use rough estimates - we use real, official rates
- Gives accurate payback periods and savings calculations

---

### ☀️ Australian Solar Zone Database (Our Own Database)

**What it is:** Clean Energy Council's official solar irradiance zones across Australia - how much sunshine different areas get.

**What data we have stored:**
- **Solar zones 1-7**: Australia divided into zones based on annual sunshine
- **Annual irradiance**: How many kWh of solar energy hits each square meter per year
- **STC multipliers**: How many Small Technology Certificates (rebates) you get in each zone
- **Monthly variations**: How solar generation changes throughout the year
- **Peak sun hours**: Equivalent hours of full sunshine per day

**Is it live or historical?**
- 📁 **Static reference data** - based on decades of weather bureau data
- 🔄 **Rarely changes** - climate patterns are stable over long periods
- ✅ **Highly accurate** - foundation data used by entire Australian solar industry

**What we use it for:**
- Estimating annual solar generation for any location
- Calculating Small Technology Certificate (STC) rebate values
- Sizing battery systems based on expected solar production
- Setting realistic expectations for solar + battery performance

---

### 🗺️ Location/Postcode Database (Our Own Database)

**What it is:** Mapping system that connects postcodes to solar zones, electricity networks, and rebate programs.

**What data we have stored:**
- **Postcode to solar zone mapping**: Which of the 7 solar zones each postcode falls into
- **State and electricity network mapping**: Which distributor serves each area
- **Grid region identification**: AEMO market regions (NSW1, VIC1, etc.)
- **Coordinates**: Latitude/longitude for weather API calls

**Is it live or historical?**
- 📁 **Static reference data** - postcodes and zones don't change often
- ✅ **Complete coverage** - all Australian postcodes mapped

**What we use it for:**
- Automatically determining solar potential from postcode
- Selecting correct tariff rates for location
- Applying appropriate rebate programs
- Calling weather APIs with correct coordinates

---

## 2. Current Calculator Functionality

### How The Calculator Works Today

Think of our calculator as a smart interview that gets progressively more detailed, gathering just enough information to make accurate recommendations.

#### Stage 1: Quick Location & Household Setup
**What we collect:**
- **Postcode** → Instantly determines solar zone, climate, and electricity network
- **Household size** → Estimates electricity usage patterns (bigger families use more power)

**What happens behind the scenes:**
- Look up solar zone for accurate generation estimates
- Determine which electricity tariffs are available
- Estimate daily electricity usage (family of 4 ≈ 25 kWh/day)

#### Stage 2: Understanding Motivation & Context
**What we collect:**
- **Primary motivation** → Cost savings vs environmental benefits vs backup power
- **Current energy provider** → Helps with tariff optimization recommendations
- **Existing solar** → Changes the entire calculation (solar + battery vs battery-only)
- **Electric vehicle** → Adds another major energy use that batteries can optimize

**What happens behind the scenes:**
- Prioritize recommendations based on what matters most to user
- Calculate solar excess available for battery storage (if applicable)
- Factor in EV charging patterns and special EV tariffs

#### Stage 3: Technical Details & Financial Picture
**What we collect:**
- **Quarterly electricity bill** → Most accurate way to estimate actual usage
- **Solar system size** → Determines excess generation available for storage
- **Tariff type** → Time-of-use tariffs create much better battery arbitrage opportunities
- **Household income** → Determines eligibility for state rebates (income testing)

**What happens behind the scenes:**
- **Real tariff analysis** → Call our DMO/VDO database to get actual rates
- **Solar generation calculation** → Use Clean Energy Council zones + current weather (BOM API)
- **Battery arbitrage modeling** → Calculate savings from buying cheap power, using during expensive times
- **Rebate eligibility** → Determine federal ($4,650) + state rebate eligibility

#### Stage 4: Contact & Personalized Report Generation
**What we collect:**
- **Email address** → For detailed report delivery
- **Phone number** → Optional for installer consultation

**What happens behind the scenes:**
- **Complete financial modeling** → All value streams calculated (solar storage, arbitrage, peak avoidance)
- **System sizing** → Recommend optimal battery size based on usage and solar
- **Payback analysis** → Calculate break-even point with real costs and savings
- **Environmental impact** → CO2 reduction based on actual grid carbon intensity

### Key Calculations We Perform

#### 1. Solar Generation Estimates
- **Base calculation**: Solar zone data × system size × efficiency factors
- **Weather enhancement**: Adjust for current cloud cover and temperature (BOM API)
- **Seasonal modeling**: Monthly generation patterns for cash flow planning

#### 2. Battery Savings (Three Value Streams)
- **Solar storage value**: Store 5c feed-in tariff energy, use during 45c peak rates
- **Time-of-use arbitrage**: Buy 22c off-peak power, discharge during 45c peak periods
- **Peak avoidance**: Replace expensive 6-9pm usage with stored energy

#### 3. Financial Analysis
- **System costs**: Battery + installation, adjusted for location (metro vs regional pricing)
- **Rebate calculations**: Federal $4,650 (no income test) + state rebates (income tested)
- **Real tariff comparison**: Use actual DMO/VDO rates, not estimates
- **Payback modeling**: When system pays for itself based on actual savings

#### 4. Equipment Recommendations
- **Battery sizing**: Based on household usage patterns and solar generation
- **Technology matching**: Different battery types for different use cases
- **Installation requirements**: Existing solar integration, electrical upgrades

---

## 3. Data Gaps & Opportunities

### What We're Missing (But Could Get)

#### 🔄 Historical Weather Patterns
**Current state**: Only live weather data from BOM
**Opportunity**: Build database of seasonal solar generation patterns
**Value**: Better monthly/yearly generation forecasts, seasonal battery optimization

#### 📈 Grid Price History & Patterns
**Current state**: Live electricity prices only
**Opportunity**: OpenNEM has 5+ years of 5-minute price data
**Value**: "Smart charging" recommendations based on historical price patterns (e.g., "power is usually cheapest Tuesday 2-4am")

#### 🏠 Actual Usage Pattern Data
**Current state**: Estimate usage from quarterly bills
**Opportunity**: Smart meter integration or usage pattern surveys
**Value**: Much more accurate battery sizing and charging schedules

#### ⚡ Grid Reliability History
**Current state**: No outage or reliability data
**Opportunity**: Track power outages and grid stability events
**Value**: Better backup power value calculations ("your area loses power 2.3 times per year")

#### 🔋 Real Battery Performance Data
**Current state**: Manufacturer specifications and modeling
**Opportunity**: Track actual battery performance from installed systems
**Value**: More accurate degradation models and ROI calculations

### Strategic Database Development

#### Option A: Build Our Own Historical Database
**Approach**: Start collecting and storing historical data now for future use
**Timeline**: 6-12 months to build meaningful patterns
**Cost**: Development time + storage costs
**Benefit**: Unique competitive advantage with proprietary insights

#### Option B: Enhanced API Integration
**Approach**: Integrate with existing historical data sources (OpenNEM historical, BOM climate data)
**Timeline**: 2-4 weeks implementation
**Cost**: API costs + development time
**Benefit**: Immediate access to years of historical data

#### Option C: Hybrid Approach (Recommended)
**Approach**: Integrate historical APIs immediately + start building our own database
**Timeline**: Quick wins in weeks, long-term advantage in months
**Cost**: Medium upfront, high long-term value
**Benefit**: Best of both worlds - immediate improvement + future competitive moat

---

## 4. Calculator Optimization Opportunities

### Current Strengths
✅ **Real government tariff data** (not estimates)
✅ **Live weather integration** for accurate solar forecasting
✅ **Comprehensive rebate modeling** with income testing
✅ **Multi-value stream analysis** (solar storage + arbitrage + peak avoidance)
✅ **Professional equipment recommendations**

### Areas for Enhancement

#### 🎯 Dynamic Optimization
**Current**: Static recommendations based on user inputs
**Future**: Interactive tools letting users adjust variables and see impact
**Example**: "What if I got a bigger battery?" or "What if electricity prices increase 5%?"

#### 📊 Scenario Modeling
**Current**: Single best-case recommendation
**Future**: Multiple scenarios with different assumptions
**Example**: Conservative/realistic/optimistic savings projections

#### 🔄 Live Market Integration
**Current**: Daily/static calculations
**Future**: Real-time optimization suggestions
**Example**: "Charge your battery now - electricity is unusually cheap today"

#### 🏆 Personalized Recommendations
**Current**: One-size-fits-most battery sizing
**Future**: AI-driven personalization based on actual usage patterns
**Example**: "Your usage spikes on weekends - consider a larger battery for weekend backup"

---

## 5. Next Phase: Calculator Configurability

### Vision for Interactive Results Screen

The goal is to transform the final report from a static recommendation into an interactive configuration tool where users can:

#### 🔧 Battery Size Configurability
- **Slider controls**: Adjust battery capacity and see impact on payback/savings
- **Use case optimization**: "Optimize for backup power" vs "optimize for savings" vs "optimize for environment"
- **Cost trade-offs**: "Spend $2000 more for 18 months faster payback"

#### ⚡ System Configuration Options
- **Technology choices**: LiFePO4 (safe, long-life) vs Li-ion (compact, cheaper)
- **Installation options**: Ground-mounted vs wall-mounted vs indoor
- **Expansion planning**: "Start with 10kWh, expand to 20kWh later"

#### 💰 Financial Scenario Planning
- **Tariff optimization**: Compare different electricity plans
- **Future planning**: Model EV purchase, pool installation, etc.
- **Rebate timing**: "Install by June 30 to guarantee current rebates"

#### 🎯 Advanced Optimization Features
- **Time-of-use strategy**: Configure charging/discharging schedules
- **Grid interaction**: Virtual Power Plant participation options
- **Smart home integration**: Consider existing smart devices and future additions

### Technical Implementation Strategy

#### Phase 1: Enhanced Data Foundation
1. Integrate OpenNEM historical data for price pattern analysis
2. Build user preferences database for personalization
3. Create battery performance tracking system

#### Phase 2: Interactive Calculator
1. Real-time calculation engine for instant feedback
2. Scenario comparison tools
3. Advanced financial modeling with multiple variables

#### Phase 3: Smart Optimization
1. Machine learning for personalized recommendations
2. Live market integration for dynamic optimization
3. Predictive modeling for future savings

---

## Conclusion

BatteryIQ currently has a solid foundation with accurate government data, real-time weather integration, and comprehensive financial modeling. The next evolution involves adding historical data insights, interactive configurability, and personalized optimization to create the most sophisticated battery calculator in Australia.

The combination of real government tariff data, live weather integration, and planned historical analytics puts us in a unique position to offer recommendations that are both highly accurate and personally relevant.

Key next steps:
1. **Immediate**: Integrate OpenNEM historical data for price pattern insights
2. **Short-term**: Build interactive configuration tools for the results screen
3. **Long-term**: Develop proprietary optimization algorithms based on real performance data

This data-driven approach ensures our recommendations aren't just accurate today, but get smarter over time as we collect more real-world performance data from actual installations.