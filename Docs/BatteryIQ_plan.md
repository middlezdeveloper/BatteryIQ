# BatteryIQ - Complete Solar & Battery Configurator Production Plan

## 🎯 Project Overview

**Brand**: BatteryIQ (batteryiq.com.au)
**Positioning**: Intelligent battery and solar optimization for smart, environmentally conscious Australians

Build a production-ready solar and battery configurator that helps Australian consumers make intelligent energy decisions through multi-objective optimization (cost vs emissions vs backup power). Target front-page Google rankings within 4 weeks through strategic SEO targeting real consumer confusion around 2025 battery rebate changes.

### Core Value Propositions
1. **Intelligent optimization**: Multi-objective optimization for cost vs emissions vs backup power
2. **Real-time rebate intelligence**: Federal + state rebate stacking with 2025 confusion clarity
3. **Smart grid strategies**: Grid-charging optimization and non-solar battery scenarios
4. **Installation timing intelligence**: Maximize rebate value with commissioning date optimization
5. **Trusted installer matching**: Verified SAA-accredited installer network integration
6. **Carbon impact intelligence**: Appeals to environmentally conscious, tech-savvy buyers

### Brand Positioning
- **"Intelligent Battery Decisions"** - Smart, data-driven approach
- **Tech-savvy environmental focus** - Appeals to carbon-conscious buyers who value smart technology
- **Authority positioning** - "Battery IQ" suggests expertise and intelligence
- **Growth potential** - Can expand from calculators to full energy intelligence platform

---

## 🏗️ Architecture Overview

- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **Backend**: Node.js API with Express/Fastify, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **CMS**: Headless CMS (Strapi/Sanity) for content management
- **Caching**: Redis for API responses and calculations
- **SEO**: Advanced Next.js SEO, structured data, sitemap generation
- **Analytics**: Google Analytics 4, Search Console, heat mapping
- **Deployment**: Vercel/Railway for full-stack deployment

---

## 📊 Key Data Sources (Free Priority)

### **OpenElectricity API (formerly OpenNEM)** ⭐ PRIORITY
- **Purpose**: Real-time grid mix by state, carbon intensity
- **Access**: Free tier with API key registration
- **Cost**: FREE for researchers
- **URL**: https://api.opennem.org.au/

### **AER Energy Product API** ⭐ FREE
- **Purpose**: All energy plans from retailers, DMO pricing
- **Access**: Public APIs, no authentication required
- **Cost**: FREE
- **Coverage**: NSW, VIC, SA, QLD, ACT, TAS

### **Bureau of Meteorology** ⭐ FREE
- **Purpose**: Solar exposure data, weather patterns
- **Access**: ASCII grids downloadable
- **Cost**: FREE
- **Coverage**: Australia-wide, 5km resolution

### **Clean Energy Regulator** ⭐ FREE
- **Purpose**: STC calculations, rebate data
- **Access**: STC calculator, postcode zone data
- **Cost**: FREE
- **Data**: Zone ratings, STC pricing, deeming periods

---

## 🔍 SEO Strategy & Keyword Research

### Primary High-Intent Keywords (Target First)
- **"battery IQ calculator"** - Brand + tool combination
- **"intelligent battery calculator"** - Brand positioning keywords
- **"smart battery decisions"** - Brand tagline optimization
- **"cheaper home batteries program calculator"** - Federal program exact match
- **"federal battery rebate 2025 calculator"** - High-intent tool searches
- **"can I stack NSW and federal battery rebates"** - Major consumer confusion
- **"VPP capable vs VPP required battery"** - Technical misunderstanding
- **"battery commissioned july 1 2025 rebate eligible"** - Installation timing confusion
- **"9.3 STC per kWh calculator"** - Technical rebate searches
- **"battery rebate worth it 2025"** - Decision-making queries

### 2025 Consumer Confusion Points (SEO Goldmine)
Based on research of actual consumer discussions and official sources:

1. **Installation vs Commissioning Timing**: 
   - **Confusion**: "Can I install before July 1 but get rebate if I turn on after?"
   - **Reality**: Batteries must be commissioned (tested/certified) on/after July 1, 2025
   - **SEO Opportunity**: "installation vs commissioning date battery rebate"

2. **Rebate Stacking Rules**: 
   - **Confusion**: "Can I get both NSW and federal battery rebates?"
   - **Reality**: NSW suspended their rebate when federal started - cannot combine
   - **SEO Opportunity**: "NSW federal battery rebate stacking rules"

3. **VPP Requirements**:
   - **Confusion**: "Do I need to join a VPP to get the rebate?"
   - **Reality**: Must be VPP-capable, but don't need to actually join one
   - **SEO Opportunity**: "VPP capable vs VPP required rebate"

4. **Declining Value Urgency**:
   - **Confusion**: "Should I rush to install before rebates disappear?"
   - **Reality**: Battery rebate declines slower (9.7% yearly) than solar rebate (16.7%)
   - **SEO Opportunity**: "battery rebate declining schedule 2025-2030"

5. **Usable vs Nominal Capacity**:
   - **Confusion**: "Why is my rebate less than expected?"
   - **Reality**: Rebate calculated on usable capacity, not total battery size
   - **SEO Opportunity**: "usable vs nominal battery capacity rebate"

### Content Strategy for BatteryIQ
- **50+ location-based landing pages** ("Sydney Intelligent Battery Calculator", "Melbourne Smart Battery Solutions")
- **Product intelligence pages** ("Tesla Powerwall IQ Test", "Battery Intelligence Comparison")  
- **Decision intelligence pages** ("Smart Battery ROI Calculator", "Intelligent Energy Storage 2025")
- **Authority guides** ("Complete Battery Intelligence Guide", "Smart Rebate Stacking Strategy")
- **Confusion-busting content** ("VPP Capable vs Required Explained", "Installation vs Commissioning Intelligence")

---

## 🗓️ Development Timeline (30 Days to MVP)

## Phase 0: SEO Foundation (Days -7 to 0)
*Start BEFORE development*

### 0.1 SEO Research & Strategy
**Claude Code Prompt:**
```
Create comprehensive SEO strategy for BatteryIQ (batteryiq.com.au) - intelligent battery configurator targeting Australian market:

1. Brand-Focused Keyword Research:
   - Primary brand keywords: "battery IQ", "intelligent battery calculator", "smart battery decisions"
   - Federal rebate confusion: "cheaper home batteries calculator", "federal battery rebate 2025"
   - Consumer confusion goldmine: "VPP capable vs required", "installation vs commissioning date"
   - Location-based: "intelligent battery [city]", "smart battery [state]"
   - Decision keywords: "battery rebate worth it 2025", "smart battery investment"

2. 2025 Rebate Confusion Analysis:
   - Target confusion around NSW rebate suspension vs federal program
   - Installation timing requirements (July 1, 2025 commissioning deadline)
   - VPP capability requirements vs actual VPP participation
   - Usable vs nominal capacity rebate calculations
   - Rebate stacking rules by state

3. BatteryIQ Content Strategy:
   - Authority positioning: "Intelligent Battery Decisions" 
   - Topic clusters: intelligence, optimization, rebate clarity, carbon impact
   - Target tech-savvy, environmentally conscious buyers
   - Educational content addressing widespread rebate confusion

4. Competitive Advantage:
   - First to address 2025 rebate confusion systematically
   - "Intelligence" positioning vs generic "calculator" competitors
   - Real-time rebate stacking with state-by-state rules
   - Carbon-conscious buyer focus with ROI intelligence

Generate detailed keyword list targeting both brand positioning and rebate confusion opportunities.
```

### 0.2 Technical SEO Foundation
**Claude Code Prompt:**
```
Set up comprehensive technical SEO infrastructure:

1. Core Web Vitals Optimization:
   - Performance monitoring configuration
   - Image optimization pipeline
   - Critical CSS extraction
   - JavaScript bundling strategy

2. Schema Markup Templates:
   - Calculator/SoftwareApplication schema for tools
   - LocalBusiness schema for installer listings
   - Product schema for battery/solar hardware
   - FAQ schema for rebate confusion content

3. Sitemap Generation System:
   - Dynamic sitemap for 1000+ location pages
   - Priority-based URL classification
   - Real-time rebate data integration

4. Analytics Setup:
   - Google Analytics 4 with enhanced ecommerce
   - Search Console with keyword tracking
   - Core Web Vitals monitoring
   - Conversion tracking for calculator usage

Include automated SEO audit tools and performance monitoring.
```

---

## Phase 1: Foundation & SEO Infrastructure (Days 1-3)

### 1.1 Project Initialization & Structure
**Claude Code Prompt:**
```
Create full-stack TypeScript project for solar battery configurator with comprehensive SEO:

Requirements:
- Next.js 14+ with App Router and static generation
- TypeScript strict configuration
- Tailwind CSS with custom design system
- Prisma ORM with PostgreSQL
- Express.js API server
- Headless CMS integration (Strapi/Sanity)

SEO Optimization Setup:
- next-seo configuration with dynamic meta tags
- Structured data (JSON-LD) for calculators and locations
- Automatic sitemap generation for 1000+ pages
- Open Graph and Twitter Card optimization
- Core Web Vitals optimization

Analytics Integration:
- Google Analytics 4 with calculator event tracking
- Google Search Console integration
- Google Tag Manager container

Folder Structure:
- /app (Next.js 14 app router with SEO-optimized pages)
- /components (reusable UI with schema markup)
- /content (dynamic content and location data)
- /lib (utilities, SEO helpers, API integrations)
- /public (optimized images, favicons, manifest)

Include performance testing and SEO audit automation.
```

### 1.2 Database Schema Design
**Claude Code Prompt:**
```
Design comprehensive Prisma schema for solar configurator with SEO data:

Core Tables:
- Users (location, preferences, calculator usage)
- Projects (solar/battery configurations, ROI calculations)
- Locations (postcode, state, solar zone, grid region, SEO data)
- EnergyPlans (tariff data from AER API with geo-targeting)
- Rebates (federal STC, state programs with expiry tracking)
- Hardware (batteries, inverters, panels with spec comparison)
- Calculations (ROI, emissions, savings with caching)
- Content (CMS pages, meta data, schema markup)
- SEOData (meta tags, canonical URLs, structured data)

SEO-Specific Fields:
- Dynamic meta title/description generation
- Local business schema data
- Product comparison schema
- Calculator schema markup data

Include:
- Proper relationships and indexes
- Australian postcode seed data with solar zones
- SEO metadata for location pages
- Performance optimization for calculator queries

Add sample data for major Australian cities and rebate programs.
```

### 1.3 Landing Page Architecture & Content Strategy
**Claude Code Prompt:**
```
Create comprehensive landing page architecture for SEO and conversions:

1. Homepage Optimization:
   - Hero with "Federal Battery Rebate Calculator 2025"
   - Interactive calculator preview
   - Trust signals (government data sources, certified installers)
   - Local installer network showcase
   - Core Web Vitals optimized design

2. Location-Based Landing Pages (1000+ pages):
   Generate SEO-optimized pages for:
   - Major cities: "Sydney Solar Battery Calculator"
   - Suburbs: "Parramatta Battery Storage Cost"
   - Regions: "Western Sydney Solar Rebates"
   
   Include per page:
   - Local electricity retailers and tariff data
   - State + federal rebate combinations
   - Local installer networks
   - City-specific case studies
   - Grid carbon intensity data

3. Rebate Confusion Pages:
   - "Can I Stack NSW and Federal Battery Rebates?" 
   - "VPP Capable vs Required: What's the Difference?"
   - "Installation vs Commissioning Date Impact"
   - "Battery Rebate Declining Schedule 2025-2030"

4. Product Category Pages:
   - "Tesla Powerwall 3 Calculator Australia"
   - "Enphase Battery vs BYD Cost Comparison"
   - "Grid-Only Battery Calculator (No Solar)"
   - "Commercial Solar Battery ROI Calculator"

Include dynamic content insertion and schema markup for all page types.
```

### 1.4 Content Management & SEO Automation
**Claude Code Prompt:**
```
Implement headless CMS with automated SEO content generation:

1. CMS Structure:
   - Location-based content templates
   - Rebate update automation
   - Product comparison templates
   - FAQ and confusion-point content

2. SEO Automation:
   - Meta tag generation from location data
   - Schema markup insertion for calculators
   - Internal linking suggestions
   - Content freshness tracking

3. Dynamic Content Generation:
   - Real-time rebate value insertion
   - Location-specific installer matching
   - Grid carbon intensity updates
   - Seasonal content variations

4. Content Performance Tracking:
   - Keyword ranking monitoring
   - Calculator completion rates
   - Lead generation attribution
   - Content engagement metrics

Include automated content auditing and optimization suggestions.
```

### 1.5 API Infrastructure with SEO Support
**Claude Code Prompt:**
```
Build backend API with SEO and performance optimization:

Core API Routes:
- /api/locations (postcode lookup with SEO metadata)
- /api/rebates (real-time federal + state rebate calculations)
- /api/calculations (ROI, emissions, grid timing optimization)
- /api/energy-plans (AER API integration with caching)
- /api/seo (dynamic meta tags and schema markup)
- /api/sitemap (dynamic sitemap generation)

Performance Features:
- Redis caching for expensive calculations
- Rate limiting and DDoS protection
- Compression and response optimization
- Real-time data validation

SEO-Specific Endpoints:
- Dynamic meta tag generation
- Structured data for calculators
- Location-based content delivery
- Real-time rebate status updates

Include comprehensive error handling, logging, and monitoring.
```

---

## Phase 2: SEO Content & Data Integration (Days 4-7)

### 2.1 High-Value Content Creation
**Claude Code Prompt:**
```
Create high-authority content targeting 2025 rebate confusion:

1. Ultimate Authority Guides (10,000+ words each):
   - "Complete Guide to 2025 Battery Rebates: Federal + State Stacking"
   - "VPP Requirements Explained: Capable vs Required for Rebates"
   - "Installation vs Commissioning Date: Battery Rebate Timing Guide"
   - "Cheaper Home Batteries Program: Everything You Need to Know"

2. Rebate Confusion Content (200+ pages):
   - "Can I Stack [State] and Federal Battery Rebates?" for each state
   - "Battery Rebate Eligibility: [State] Requirements 2025"
   - "[City] Battery Installer Guide: Rebate-Approved Professionals"
   - "Battery Rebate Calculator: [State] vs Federal Comparison"

3. Technical Authority Content:
   - "9.3 STC per kWh: How Battery Rebates Actually Work"
   - "VPP-Capable Battery List: Rebate Eligible Models 2025"
   - "Battery Commissioning vs Installation: Legal Requirements"
   - "50kWh Cap Explained: Maximum Battery Rebate Calculations"

4. Timing and Urgency Content:
   - "Should You Install Battery Now or Wait? 2025-2030 Analysis"
   - "Battery Rebate Declining Schedule: Year-by-Year Breakdown"
   - "July 1 2025 Deadline: What You Need to Know"

Include internal linking strategy and conversion optimization.
```

### 2.2 External API Integration with Content Enhancement
**Claude Code Prompt:**
```
Integrate Australian energy APIs with automated content generation:

1. OpenElectricity API with Content Creation:
   - Real-time grid mix data for "Grid is X% renewable right now" content
   - Carbon intensity tracking for optimal battery timing
   - State-specific renewable energy content generation
   - Historical pattern analysis for seasonal content

2. AER Energy Product API with Local SEO:
   - All energy retailer plans by location
   - Tariff comparison content automation
   - Location-specific retailer availability
   - Time-of-use rate optimization content

3. Clean Energy Regulator Service with Authority Building:
   - Real-time STC pricing for rebate calculators
   - Zone rating explanations and maps
   - Rebate deadline countdown content
   - Deeming period impact calculations

4. SEO Content Automation:
   - Location-based content generation from energy data
   - Real-time rebate value updates in content
   - Seasonal optimization suggestions
   - Grid cleanliness timing recommendations

Include error handling, caching, and content quality validation.
```

### 2.3 Local SEO & Business Listings
**Claude Code Prompt:**
```
Implement comprehensive local SEO for installer network:

1. Google Business Profile Optimization:
   - Service area definitions for calculator tool
   - Regular content posting about rebate updates
   - Local keyword optimization
   - Review management integration

2. Local Directory Strategy:
   - Australian business directory submissions
   - Energy industry-specific directories
   - Government contractor listings
   - Clean Energy Council member directories

3. Local Link Building Automation:
   - Partnership outreach with local installers
   - Community organization engagement
   - Local energy news monitoring and response
   - Government liaison opportunities

4. Local Content Generation:
   - City-specific case studies and success stories
   - Local energy market analysis
   - Regional rebate and incentive tracking
   - Community solar project coverage

Include automated monitoring and local SEO performance reporting.
```

---

## Phase 3: Core Calculation Engine & SEO Landing Pages (Days 8-12)

### 3.1 Multi-Objective Optimization Engine
**Claude Code Prompt:**
```
Create comprehensive optimization engine for battery and solar systems:

1. Four Optimization Strategies:
   - Cost optimization: Peak shaving, grid arbitrage
   - Emissions optimization: Grid carbon timing, renewable matching
   - Backup power optimization: Essential load coverage, outage resilience
   - Hybrid optimization: Weighted combination based on user priorities

2. Battery Sizing Calculator:
   - Daily usage pattern analysis from household profile
   - Peak vs off-peak consumption optimization
   - Essential load backup requirements assessment
   - Charge/discharge rate limitation handling
   - Round-trip efficiency calculations

3. Solar + Grid Scenarios:
   - Solar-first, grid-backup charging strategies
   - Grid-only battery scenarios for renters
   - Time-of-use arbitrage without solar
   - Optimal battery size for each scenario

4. Financial Modeling:
   - Real-time rebate integration (federal + state)
   - ROI calculations with declining rebate projections
   - Payback period analysis with different strategies
   - NPV and IRR calculations for investment decisions

Include detailed explanations and assumption documentation for SEO content.
```

### 3.2 Rebate Calculation Engine with Timing Optimization
**Claude Code Prompt:**
```
Build comprehensive rebate system addressing 2025 confusion:

1. Federal Rebate Calculator:
   - Real-time STC pricing integration
   - 9.3 STC per kWh calculation with usable capacity
   - 50kWh cap handling and explanation
   - Installation vs commissioning date impact
   - Annual decline projections through 2030

2. State Rebate Integration:
   - NSW VPP incentive (suspended during federal program)
   - WA Battery Scheme stacking rules
   - Victoria interest-free loans
   - SA REPS VPP incentives
   - QLD Battery Booster (ended) historical data

3. Rebate Stacking Logic:
   - State-by-state compatibility matrix
   - Mutual exclusion detection and explanation
   - Maximum combined benefit calculations
   - Installation timeline optimization

4. Timing Optimization:
   - "Install now vs wait" calculator with declining values
   - Budget exhaustion risk assessment for state programs
   - Optimal installation scheduling
   - Deadline tracking and urgency messaging

Include clear explanations for SEO content and user education.
```

### 3.3 SEO-Optimized Calculator Interface
**Claude Code Prompt:**
```
Create high-converting calculator interface optimized for SEO:

1. Multi-Step Calculator Wizard:
   - Location entry with SEO-optimized suggestions
   - Current energy usage input (bill upload or estimation)
   - Household profile and energy priorities
   - System configuration with real-time calculations
   - Results presentation with sharing capabilities

2. SEO Optimization:
   - Schema markup for SoftwareApplication
   - Progressive loading for Core Web Vitals
   - Internal linking to relevant content
   - Social sharing optimization
   - Conversion tracking integration

3. Results Dashboard:
   - Federal + state rebate breakdown
   - ROI projections with multiple scenarios
   - Environmental impact visualization
   - Installer recommendations with reviews
   - PDF quote generation

4. Conversion Optimization:
   - Trust signals and government data sources
   - Clear call-to-action placement
   - Progress indicators and completion rates
   - A/B testing framework for optimization

Include mobile-first responsive design and accessibility compliance.
```

### 3.4 Dynamic Landing Page Generation
**Claude Code Prompt:**
```
Create automated landing page system for 1000+ SEO pages:

1. Location-Based Page Generator:
   - 500+ city/suburb pages with local data
   - State-specific rebate combination pages
   - Retailer availability by location
   - Local installer networks with reviews

2. Product-Specific Landing Pages:
   - Battery model comparison calculators
   - Brand-specific rebate eligibility
   - Installation requirement differences
   - Warranty and performance comparisons

3. Intent-Based Landing Pages:
   - "Is Battery Worth It in [Location]?" decision tools
   - "Best Battery for [Household Type]" recommendations
   - "Battery Rebate ROI Calculator [Year]" projections
   - "Grid-Only vs Solar Battery [Location]" comparisons

4. SEO Optimization:
   - Dynamic meta tag generation from location data
   - Structured data for local business/product info
   - Internal linking automation
   - Content freshness and update tracking

Include quality assurance and automated SEO auditing for generated pages.
```

---

## Phase 4: Frontend UX & Advanced SEO (Days 13-18)

### 4.1 User Experience & Conversion Optimization
**Claude Code Prompt:**
```
Build conversion-optimized frontend with SEO integration:

1. Homepage Design:
   - Above-the-fold calculator widget
   - Federal rebate countdown timer (urgency)
   - Trust signals (government partnerships, installer network)
   - Location-based content personalization
   - Core Web Vitals optimized loading

2. Calculator User Flow:
   - Progressive disclosure with progress indicators
   - Real-time validation and helpful error messages
   - Social proof integration (recent calculations, success stories)
   - Clear value proposition reinforcement
   - Mobile-first responsive design

3. Results Presentation:
   - Visual ROI breakdown with federal + state rebates
   - Environmental impact gamification
   - Installer matching with reviews and quotes
   - Social sharing with custom OG images
   - PDF export with tracking

4. SEO Integration:
   - Dynamic breadcrumb navigation
   - Related content recommendations
   - Internal linking optimization
   - Schema markup for user interactions

Include heat mapping integration and user behavior analytics.
```

### 4.2 Advanced SEO Features & Authority Building
**Claude Code Prompt:**
```
Implement advanced SEO features for competitive ranking:

1. Content Hub Architecture:
   - Topic clusters around rebates, installation, ROI
   - Pillar pages for major topics with supporting content
   - Content upgrading based on user calculator inputs
   - Expert quote integration and government data citations

2. Authority Building:
   - Government data source integration and attribution
   - Industry expert interviews and quotes
   - Academic research references and summaries
   - Thought leadership content on energy policy

3. User-Generated Content:
   - Customer success story collection
   - Review and testimonial integration
   - Q&A community for rebate questions
   - Case study submission system

4. Advanced Link Building Tools:
   - Competitor backlink analysis
   - Government website outreach tracking
   - Industry publication relationship management
   - Resource page link building automation

Include automated outreach tools and relationship CRM.
```

### 4.3 Performance Optimization & Monitoring
**Claude Code Prompt:**
```
Optimize for Core Web Vitals and search performance:

1. Performance Optimization:
   - Image optimization with next/image
   - Critical CSS extraction and inlining
   - JavaScript code splitting and lazy loading
   - Service worker for calculator caching
   - CDN integration for global performance

2. SEO Monitoring Dashboard:
   - Real-time keyword ranking tracking
   - Search Console data integration
   - Competitor monitoring and alerts
   - Core Web Vitals tracking
   - Conversion rate optimization

3. Calculator Performance:
   - Calculation result caching with Redis
   - Progressive web app capabilities
   - Offline functionality for basic calculations
   - Performance budget enforcement

4. Analytics Integration:
   - Calculator usage funnel analysis
   - Rebate value impact on conversions
   - Content performance attribution
   - Lead quality assessment and tracking

Include automated alerting for performance and SEO issues.
```

---

## Phase 5: Launch Optimization & SEO Acceleration (Days 19-24)

### 5.1 SEO Launch Strategy & Rapid Indexing
**Claude Code Prompt:**
```
Implement aggressive SEO launch for rapid ranking:

1. Rapid Indexing Strategy:
   - Google Search Console sitemap submission
   - IndexNow protocol implementation
   - Social media automation for content distribution
   - Press release distribution to energy publications
   - Industry publication outreach automation

2. Content Velocity Campaign:
   - Daily blog posting for first 4 weeks on rebate topics
   - Social media content calendar with calculator promotion
   - Email newsletter launch to early users
   - Guest posting on energy and finance blogs
   - Podcast appearance booking for industry shows

3. Technical SEO Validation:
   - Core Web Vitals final optimization
   - Mobile usability testing and fixes
   - Schema markup validation across all pages
   - Crawl budget optimization for 1000+ pages
   - Site speed testing and optimization

4. Link Building Acceleration:
   - Government website outreach for calculator links
   - Energy publication resource page submissions
   - Industry directory submissions
   - Influencer partnership program launch

Include automated monitoring for rapid response to SEO issues.
```

### 5.2 Marketing Integration & Amplification
**Claude Code Prompt:**
```
Build comprehensive marketing system for SEO amplification:

1. Content Marketing Automation:
   - Blog post promotion across social channels
   - Email newsletter with calculator usage tips
   - Lead magnet distribution (rebate guides, timing optimizers)
   - Content repurposing for different formats

2. Local Marketing Integration:
   - Google Ads for high-intent calculator keywords
   - Facebook Ads with location targeting
   - Local installer partnership promotion
   - Community event and expo participation

3. PR and Outreach Automation:
   - Press release templates for rebate updates
   - Journalist outreach for policy commentary
   - Industry publication guest posting
   - Government liaison for partnership opportunities

4. Conversion Optimization:
   - A/B testing for calculator flow
   - Lead quality optimization
   - Installer match success tracking
   - Customer lifetime value analysis

Include comprehensive reporting for marketing ROI and SEO attribution.
```

### 5.3 Quality Assurance & Monitoring
**Claude Code Prompt:**
```
Implement comprehensive quality assurance and monitoring:

1. Automated Testing:
   - Calculator accuracy validation
   - Rebate calculation verification
   - Cross-browser compatibility testing
   - Mobile responsiveness testing
   - Performance regression testing

2. SEO Quality Assurance:
   - Meta tag completeness checking
   - Schema markup validation
   - Internal linking verification
   - Content freshness monitoring
   - Duplicate content detection

3. Data Quality Monitoring:
   - Rebate data accuracy verification
   - Energy plan pricing updates
   - Installer information validation
   - Government policy change tracking

4. User Experience Monitoring:
   - Calculator completion rate tracking
   - Error rate monitoring and alerting
   - User feedback collection and analysis
   - Conversion funnel optimization

Include automated reporting and alerting systems.
```

---

## Phase 6: Production Deployment & Monitoring (Days 25-30)

### 6.1 Production Deployment & CI/CD
**Claude Code Prompt:**
```
Set up production deployment with comprehensive monitoring:

1. Deployment Pipeline:
   - GitHub Actions with calculator accuracy testing
   - Automated SEO auditing in CI/CD
   - Performance testing and Core Web Vitals validation
   - Security scanning and dependency updates

2. Infrastructure as Code:
   - Docker containerization for all services
   - Database migration automation with rebate data
   - Environment configuration for production scale
   - Backup and disaster recovery for calculator data

3. Monitoring & Alerting:
   - Application performance monitoring (APM)
   - Error tracking with calculator-specific alerts
   - SEO performance dashboards
   - Business KPI tracking (calculator usage, conversions)

4. Scaling Preparation:
   - Load balancing for calculator traffic
   - Database optimization for rebate calculations
   - CDN setup for global performance
   - Caching strategy for expensive calculations

Include deployment checklist and rollback procedures.
```

### 6.2 Launch Strategy & Growth Hacking
**Claude Code Prompt:**
```
Execute launch strategy targeting front-page rankings:

1. Pre-Launch SEO Setup:
   - Submit sitemap for 1000+ location pages
   - Activate social media promotion automation
   - Launch email outreach to energy industry contacts
   - Activate press release distribution

2. Launch Week Activities:
   - Daily content publishing on rebate confusion topics
   - Social media blitz with calculator sharing
   - Influencer outreach in personal finance space
   - Government liaison for official endorsement

3. Growth Hacking Tactics:
   - Viral sharing mechanics in calculator results
   - Referral system for installer recommendations
   - Free rebate guides in exchange for email signup
   - Local news outreach with calculator data insights

4. Performance Tracking:
   - Daily keyword ranking monitoring
   - Calculator usage and conversion tracking
   - Social media engagement and sharing metrics
   - Backlink acquisition monitoring

Include rapid response protocols for viral content opportunities.
```

---

## 🎯 Success Metrics & KPIs

### Technical Metrics
- **Core Web Vitals**: All pages score 90+ on mobile/desktop
- **Page Speed**: Calculator loads in <2 seconds
- **Uptime**: 99.9% availability
- **Error Rate**: <0.1% for calculator functions

### SEO Metrics
- **Rankings**: Front page for 20+ primary keywords within 4 weeks
- **Organic Traffic**: 10,000+ monthly visitors by month 2
- **Click-Through Rate**: 8%+ for primary keyword rankings
- **Backlinks**: 100+ quality backlinks within 3 months

### Business Metrics
- **Calculator Completions**: 1,000+ per month
- **Lead Generation**: 500+ qualified installer requests per month
- **Conversion Rate**: 15%+ from calculator to quote request
- **User Retention**: 40%+ return for updated calculations

### Content Metrics
- **Page Coverage**: 1,000+ location-based pages indexed
- **Content Engagement**: 5+ minute average time on authority guides
- **Social Shares**: 1,000+ calculator results shared monthly
- **Email Signups**: 10%+ conversion rate for rebate guides

---

## 🛠️ Claude Code Implementation Commands

Copy these exact prompts to implement each phase systematically:

### Phase 0 - SEO Foundation
1. Run SEO research prompt (0.1)
2. Run technical SEO setup prompt (0.2)

### Phase 1 - Foundation
1. Run project initialization prompt (1.1)
2. Run database schema prompt (1.2)
3. Run landing page architecture prompt (1.3)
4. Run CMS setup prompt (1.4)
5. Run API infrastructure prompt (1.5)

### Phase 2 - Content & Data
1. Run content creation prompt (2.1)
2. Run API integration prompt (2.2)
3. Run local SEO prompt (2.3)

### Phase 3 - Calculations
1. Run optimization engine prompt (3.1)
2. Run rebate calculator prompt (3.2)
3. Run calculator interface prompt (3.3)
4. Run landing page generator prompt (3.4)

### Phase 4 - Frontend & UX
1. Run UX optimization prompt (4.1)
2. Run advanced SEO prompt (4.2)
3. Run performance optimization prompt (4.3)

### Phase 5 - Launch
1. Run SEO launch strategy prompt (5.1)
2. Run marketing integration prompt (5.2)
3. Run quality assurance prompt (5.3)

### Phase 6 - Production
1. Run deployment setup prompt (6.1)
2. Run launch strategy prompt (6.2)

---

## 📈 Expected Outcomes

### Week 4 Results
- **Google Rankings**: Front page for primary keywords
- **Traffic**: 5,000+ monthly organic visitors
- **Calculator Usage**: 500+ completions per month
- **Lead Generation**: 200+ installer quote requests

### Month 3 Results  
- **Rankings**: Top 3 for major keywords
- **Traffic**: 25,000+ monthly organic visitors
- **Calculator Usage**: 2,500+ completions per month
- **Lead Generation**: 1,000+ installer quote requests
- **Revenue**: Sustainable through installer partnerships

This plan provides a complete roadmap for building a production-ready solar and battery configurator that addresses real consumer confusion around 2025 rebate changes while achieving aggressive SEO goals through strategic content and technical optimization.