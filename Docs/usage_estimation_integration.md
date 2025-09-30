# BatteryIQ Usage Estimation Integration Plan

## Overview

Integrate intelligent household usage estimation into BatteryIQ's existing calculator to provide more accurate battery sizing and savings calculations. This enhances **Stage 1 & Stage 3** of the current calculator flow.

---

## Current vs Enhanced Flow

### Current Flow (Stage 1)
```
Postcode → Household size → [Basic usage estimate]
```

### Enhanced Flow (Stage 1 + Optional Detail)
```
Postcode → Household size → [Initial estimate with confidence]
↓
"Get more accurate estimate" option
↓
Dwelling type + Heating/Cooling + Hot water + Pool + EV + Cooking + WFH
↓
[High-confidence usage estimate with breakdown]
```

---

## Integration Points

### 1. Stage 1 Enhancement (Quick Estimate)

**Current collection:**
- Postcode
- Household size

**Add to Stage 1:**
- Dwelling type (apartment/townhouse/house)
- "Do you have electric heating or air conditioning?" (yes/no)

**Why:** These two questions dramatically improve accuracy (±25% to ±15%) without adding friction.

### 2. New Optional Stage 1.5 (Detailed Estimate)

**Add between Stage 1 and Stage 2:**
- Progressive disclosure: "Want a more accurate estimate? Answer a few more questions"
- Only show if user hasn't provided quarterly bill amount yet
- Skip entirely if they provide bill in Stage 3

**Questions to add:**
- Hot water system type
- Pool presence
- Electric cooking
- Work from home status

### 3. Stage 3 Enhancement (Bill Validation)

**Current:** User enters quarterly bill
**Enhanced:** 
- Compare entered bill to our estimated usage
- Flag significant discrepancies (>30% difference)
- Ask clarifying questions if mismatch detected
- Learn from actual bills to improve estimation model

---

## Claude Code Implementation Prompts

### Prompt 1: Add Usage Estimation Engine

```
Enhance BatteryIQ's existing calculator by adding an intelligent household usage estimation engine.

## Context
BatteryIQ currently collects:
- Stage 1: Postcode, household size
- Stage 3: Quarterly electricity bill (optional)

We need to estimate usage more accurately BEFORE they provide a bill, using additional household characteristics.

## Requirements

### 1. Create Usage Estimation Service

File: `/lib/services/usageEstimation.ts`

```typescript
interface HouseholdProfile {
  // Existing data we already collect
  postcode: string;
  state: string;
  householdSize: '1-2' | '3-4' | '5+';
  
  // New data to collect
  dwellingType?: 'apartment' | 'townhouse' | 'house';
  electricHeatingCooling?: boolean | null;
  hotWaterType?: 'electric' | 'gas' | 'solar' | 'not_sure';
  hasPool?: boolean;
  electricVehicle?: 'yes' | 'planning' | 'no';
  electricCooking?: boolean | null;
  workFromHome?: 'full-time' | 'part-time' | 'no';
}

interface UsageEstimate {
  annualKwh: number;
  dailyKwh: number;
  monthlyKwh: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  confidencePercentage: number;
  breakdown: {
    baseload: number;
    heatingCooling: number;
    hotWater: number;
    pool: number;
    ev: number;
    other: number;
  };
  comparisonToAverage: number; // percentage above/below state average
}

class UsageEstimationService {
  // Base calculation using existing AER DMO data
  private getAERBaseline(state: string): number;
  
  // Apply household size multiplier
  private applyHouseholdMultiplier(baseline: number, size: string): number;
  
  // Apply state climate multiplier
  private applyClimateMultiplier(usage: number, state: string): number;
  
  // Apply dwelling type adjustment
  private applyDwellingMultiplier(usage: number, type: string): number;
  
  // Add heating/cooling load
  private addHeatingCoolingLoad(usage: number, state: string, hasElectric: boolean): number;
  
  // Add hot water load
  private addHotWaterLoad(usage: number, type: string): number;
  
  // Add pool pump load
  private addPoolLoad(usage: number, hasPool: boolean): number;
  
  // Add EV charging load
  private addEVLoad(usage: number, evStatus: string): number;
  
  // Add cooking adjustment
  private addCookingLoad(usage: number, isElectric: boolean): number;
  
  // Add work from home adjustment
  private addWFHLoad(usage: number, wfhStatus: string): number;
  
  // Calculate confidence level based on data completeness
  private calculateConfidence(profile: HouseholdProfile): {
    level: 'low' | 'medium' | 'high';
    percentage: number;
  };
  
  // Main estimation method
  public estimateUsage(profile: HouseholdProfile): UsageEstimate;
}
```

### 2. Integration with Existing Calculator State

The calculator currently tracks user progress through stages. Enhance the existing state management:

```typescript
// Existing calculator state (don't change)
interface CalculatorState {
  postcode: string;
  householdSize: string;
  // ... existing fields
}

// Extend with new optional fields
interface EnhancedCalculatorState extends CalculatorState {
  // Usage estimation fields (all optional)
  dwellingType?: 'apartment' | 'townhouse' | 'house';
  electricHeatingCooling?: boolean;
  hotWaterType?: 'electric' | 'gas' | 'solar' | 'not_sure';
  hasPool?: boolean;
  electricVehicle?: 'yes' | 'planning' | 'no';
  electricCooking?: boolean;
  workFromHome?: 'full-time' | 'part-time' | 'no';
  
  // Estimation results (calculated)
  estimatedUsage?: UsageEstimate;
  usageSource?: 'estimated' | 'bill-provided' | 'hybrid';
}
```

### 3. Update Database Schema

Add to existing Prisma schema (don't modify existing fields):

```prisma
model CalculatorSubmission {
  // ... existing fields remain unchanged
  
  // Add new optional usage estimation fields
  dwellingType              String?
  electricHeatingCooling    Boolean?
  hotWaterType             String?
  hasPool                  Boolean?
  electricVehicle          String?
  electricCooking          Boolean?
  workFromHome             String?
  
  // Store estimation results
  estimatedAnnualUsage     Int?
  estimatedDailyUsage      Decimal?
  usageConfidenceLevel     String?
  usageSource              String? // 'estimated', 'bill-provided', 'hybrid'
  
  // ... existing fields remain unchanged
}
```

### 4. Enhance Stage 1 UI

Update the existing Stage 1 component to include 2 additional questions:

Location: `/app/calculator/stage-1.tsx`

**After existing postcode and household size questions, add:**

```tsx
{/* Existing questions remain */}
<PostcodeInput />
<HouseholdSizeSelector />

{/* New questions - seamlessly integrated */}
<DwellingTypeSelector
  label="What type of home do you live in?"
  options={[
    { value: 'apartment', label: 'Apartment', icon: Building },
    { value: 'townhouse', label: 'Townhouse', icon: Home },
    { value: 'house', label: 'House', icon: Home }
  ]}
  tooltip="Apartments typically use 30% less energy than houses"
/>

<YesNoSelector
  label="Do you have electric heating or air conditioning?"
  tooltip="Electric heating/cooling is typically the largest energy user in Australian homes"
  helpText="This includes reverse-cycle air conditioners, ducted systems, or electric heaters"
/>

{/* Show initial estimate with confidence indicator */}
<UsageEstimatePreview
  estimate={calculatedEstimate}
  confidenceLevel="medium"
  message="Based on your answers, we estimate your household uses approximately {dailyKwh} kWh per day"
/>

{/* Progressive disclosure for more accuracy */}
<Button 
  variant="secondary"
  onClick={() => setShowDetailedQuestions(true)}
>
  Get more accurate estimate (optional)
</Button>
```

### 5. Create New Optional Stage 1.5 (Detailed Estimation)

Only show this if user clicks "Get more accurate estimate":

Location: `/app/calculator/stage-1-5.tsx`

```tsx
export function Stage1_5DetailedEstimation({ onComplete, onSkip }) {
  return (
    <div className="space-y-6">
      <ProgressIndicator>
        <span className="text-sm text-gray-600">
          Optional: Get a more accurate estimate
        </span>
        <span className="text-xs text-gray-500">
          Or skip and provide your actual electricity bill later
        </span>
      </ProgressIndicator>
      
      <HotWaterSystemSelector
        options={[
          { value: 'electric', label: 'Electric', description: 'Storage tank or instant' },
          { value: 'gas', label: 'Gas' },
          { value: 'solar', label: 'Solar hot water' },
          { value: 'not_sure', label: 'Not sure' }
        ]}
        tooltip="Hot water typically accounts for 25% of household energy"
      />
      
      <YesNoSelector
        label="Do you have a swimming pool?"
        helpText="Pool pumps typically add 2,500 kWh/year"
      />
      
      <EVSelector
        label="Do you have an electric vehicle?"
        options={[
          { value: 'yes', label: 'Yes, I have an EV now' },
          { value: 'planning', label: 'Planning to get one within 12 months' },
          { value: 'no', label: 'No EV plans' }
        ]}
        tooltip="EVs typically add 4,000 kWh/year to household usage"
      />
      
      <YesNoSelector
        label="Do you use electric cooking?"
        helpText="Electric stove/oven vs gas"
      />
      
      <WorkFromHomeSelector
        options={[
          { value: 'full-time', label: 'Yes, full-time' },
          { value: 'part-time', label: 'Yes, part-time (2-3 days)' },
          { value: 'no', label: 'No one works from home' }
        ]}
      />
      
      {/* Real-time estimate updates as they answer */}
      <UsageEstimateCard
        estimate={updatedEstimate}
        confidenceLevel="high"
        showBreakdown={true}
        comparisonText="Your household uses 15% more than the average {state} household"
      />
      
      <div className="flex gap-4">
        <Button onClick={onSkip} variant="ghost">
          Skip - I'll provide my bill later
        </Button>
        <Button onClick={onComplete} variant="primary">
          Continue with this estimate
        </Button>
      </div>
    </div>
  );
}
```

### 6. Enhance Stage 3 with Validation

When user enters their quarterly bill, validate against estimate:

```tsx
export function Stage3BillValidation({ estimatedUsage, enteredBill }) {
  const variance = Math.abs((enteredBill - estimatedUsage) / estimatedUsage);
  
  if (variance > 0.30) {
    return (
      <ValidationAlert severity="info">
        <AlertTitle>Let's double-check this</AlertTitle>
        <AlertDescription>
          Your bill amount seems {variance > 0 ? 'higher' : 'lower'} than expected 
          based on your household profile. This might mean:
          
          <ul className="mt-2 space-y-1">
            <li>• You have additional energy uses we haven't captured</li>
            <li>• Your tariff includes unusual charges</li>
            <li>• There's been a billing error</li>
          </ul>
          
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => setShowDetailedQuestions(true)}
          >
            Review household details
          </Button>
        </AlertDescription>
      </ValidationAlert>
    );
  }
  
  return (
    <ValidationSuccess>
      ✓ Your bill matches our estimate (within {variance}%)
    </ValidationSuccess>
  );
}
```

### 7. Create API Endpoint

Location: `/app/api/usage-estimate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { UsageEstimationService } from '@/lib/services/usageEstimation';

export async function POST(request: NextRequest) {
  try {
    const profile = await request.json();
    
    const estimationService = new UsageEstimationService();
    const estimate = estimationService.estimateUsage(profile);
    
    // Log for analytics and model improvement
    await logEstimation(profile, estimate);
    
    return NextResponse.json({
      success: true,
      estimate
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Helper to improve model over time
async function logEstimation(profile, estimate) {
  // Store in database for future model training
  // Compare estimates to actual bills when provided
  // Track accuracy improvements over time
}
```

### 8. Integration with Existing Battery Sizing Logic

The calculator already has battery sizing logic. Enhance it with better usage data:

```typescript
// Existing battery sizing uses estimated usage
// Enhance with more accurate estimation

function calculateBatterySize(calculatorState: EnhancedCalculatorState) {
  // Use the more accurate usage estimate
  const dailyUsage = calculatorState.estimatedUsage?.dailyKwh 
    || fallbackEstimate(calculatorState.householdSize);
  
  // Rest of existing battery sizing logic remains unchanged
  // Just uses more accurate input data
  
  const peakUsage = dailyUsage * 0.47; // Evening peak (4-10pm)
  const optimalBatterySize = Math.min(peakUsage * 1.2, 13.5); // 20% buffer, max 13.5kWh
  
  return {
    recommendedSize: optimalBatterySize,
    confidence: calculatorState.estimatedUsage?.confidenceLevel || 'low',
    reasoning: generateSizingReasoning(calculatorState)
  };
}
```

---

## Implementation Priority

### Phase 1: Minimum Viable Enhancement (Week 1)
1. Add `dwellingType` and `electricHeatingCooling` to Stage 1
2. Implement basic estimation algorithm
3. Show initial estimate with confidence
4. Test with existing calculator flow

### Phase 2: Detailed Estimation (Week 2)
1. Create optional Stage 1.5 with remaining questions
2. Add progressive disclosure UI
3. Implement full estimation algorithm with all variables
4. Add real-time estimate updates

### Phase 3: Validation & Learning (Week 3)
1. Add bill validation in Stage 3
2. Log estimates vs actual bills
3. Create admin dashboard to monitor accuracy
4. Iterate on multipliers based on real data

---

## UI/UX Principles

### Don't Break Existing Flow
- All new questions are optional or enhance existing questions
- Users can skip detailed estimation
- Bill entry in Stage 3 still works as primary method
- No existing functionality removed

### Progressive Disclosure
- Start simple (2 new questions in Stage 1)
- Offer "more accurate estimate" option
- Only show detailed questions if user opts in
- Always allow skipping to next stage

### Confidence Communication
- Show confidence level clearly (low/medium/high)
- Explain what would improve accuracy
- Compare to state averages for validation
- Build trust through transparency

### Real-time Feedback
- Update estimate as user answers questions
- Show impact of each answer ("Adding pool increases estimate by 7 kWh/day")
- Visual breakdown of usage categories
- Comparison to similar households

---

## Testing Strategy

### 1. Accuracy Validation
- Test against 100+ real bills
- Track variance between estimates and actual
- Adjust multipliers to minimize error
- Target: <15% variance for high-confidence estimates

### 2. User Experience Testing
- A/B test: detailed questions vs bill-only approach
- Measure completion rates
- Track where users drop off
- Optimize question order and wording

### 3. Integration Testing
- Ensure existing calculator stages still work
- Test with/without optional questions
- Validate database migrations
- Check API performance under load

---

## Success Metrics

### Accuracy Metrics
- Estimate vs actual bill variance: <15% (high confidence)
- Confidence level distribution: 60%+ high confidence
- Battery sizing accuracy improvement: 25%+ better recommendations

### User Experience Metrics
- Stage 1 completion rate: >90% (shouldn't drop due to 2 new questions)
- Optional Stage 1.5 engagement: 40%+ opt-in rate
- Overall calculator completion: No decrease from current baseline

### Business Metrics
- More accurate recommendations → higher conversion
- Reduced installer quote revisions
- Improved customer satisfaction scores

This integration enhances BatteryIQ's existing calculator without disrupting the proven user flow, adding intelligence where it matters most: accurate usage estimation leading to better battery recommendations.
```

This prompt is specifically tailored to your existing calculator and integrates smoothly without breaking what's already working!
