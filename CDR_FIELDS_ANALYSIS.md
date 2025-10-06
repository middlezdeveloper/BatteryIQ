# CDR API Fields - ROI Impact Analysis

## 💰 HIGH ROI IMPACT (Should Display & Calculate)

### Discounts (Currently: payOnTimeDiscount, directDebitDiscount)
- **Type**: CONDITIONAL, PAY_ON_TIME, GUARANTEED, etc.
- **Method**: percentOfBill, fixedAmount, percentOfUse
- **Display Name**: e.g., "Pay on time discount"
- **Percent of Bill**: e.g., 2% (affects total bill)
- **Fixed Amount**: e.g., $50/year
- **Description**: Full terms

**Current Status**: ✅ Captured but need to extract from CDR API
**Action Needed**: Update sync to extract discounts array

### Incentives (Currently: NOT captured)
- **Category**: OTHER, GIFT, ACCOUNT_CREDIT, etc.
- **Display Name**: e.g., "Interest Rewards", "Sign-up bonus"
- **Description**: Full details
- **Eligibility**: Any requirements

**Examples from OVO**:
- "OVO pay 3% interest on credit balances"
- "Electric Vehicle Off-Peak" (already in tariff periods)

**Current Status**: ❌ Not captured
**Action Needed**: Add incentives JSON field

### Fees (Currently: connectionFee, disconnectionFee, latePaymentFee, paperBillFee)
- **Type**: CONNECTION, DISCONNECTION, LATE_PAYMENT, PAPER_BILL, DD_DISHONOUR, etc.
- **Term**: FIXED, PERCENT_OF_BILL, etc.
- **Amount**: Dollar amount
- **Description**: Full terms

**Current Status**: ✅ Partially captured (only 4 types)
**Action Needed**: Capture ALL fees in JSON array

### Contract Terms (Currently: contractLength, exitFees)
- **Contract Length**: Months (null = ongoing)
- **Exit Fees**: Amount if you leave early
- **Cooling Off Days**: Usually 10 days
- **On Expiry**: What happens when contract ends
- **Variation**: Can they change rates?
- **Payment Options**: DIRECT_DEBIT, CREDIT_CARD, BPAY, etc.
- **Bill Frequency**: P1M (monthly), etc.

**Current Status**: ✅ Partially captured
**Action Needed**: Add more contract detail fields

## 🌱 FEATURE IMPACT (Good to Show)

### Green Power (Currently: greenPower boolean)
- **Scheme**: GREENPOWER, ACCU, etc.
- **Display Name**: e.g., "GreenPower 100"
- **Description**: Full terms
- **Tiers**: Percentage green, cost per kWh
- **Cost**: e.g., 5.5c/kWh for 100% green

**Current Status**: ✅ Boolean only
**Action Needed**: Capture full green power details

### Controlled Load (Currently: controlledLoadRate)
- **Display Name**: e.g., "Controlled Load 2"
- **Rate**: $/kWh
- **Daily Supply**: Extra daily charge
- **Description**: What it's for (hot water, pool pump, etc.)

**Current Status**: ✅ Single rate only
**Action Needed**: Support multiple controlled loads

## 📋 INFORMATIONAL (Lower Priority)

### Basic Info (Currently: ✅ Captured)
- Plan ID, Plan Name, Brand, Type, Customer Type
- Pricing Model, Is Fixed
- Valid From/To dates

### Geographic (Currently: ✅ Captured)
- Distributors, Included/Excluded Postcodes

### Eligibility (Currently: ✅ Captured)
- Requirements like EV ownership

## RECOMMENDATION FOR "SHOW MORE DETAILS"

Display these in order of ROI impact:

1. **Discounts** (if any)
   - "💰 Pay on time: 2% off total bill"
   - "💰 Direct debit: 1% off"

2. **Incentives** (if any)
   - "🎁 Interest Rewards: 3% on credit balances"
   - "🎁 $100 sign-up credit"

3. **Fees** (show the important ones)
   - "⚠️ Late payment fee: $15"
   - "⚠️ Paper bill fee: $2/month"
   - "Connection/Disconnection fees" (collapsed)

4. **Contract Terms**
   - "Contract: No lock-in" or "12 months"
   - "Exit fee: $75" (if applicable)
   - "Cooling off: 10 days"

5. **Green Power** (if available)
   - "🌱 100% GreenPower available: +5.5c/kWh"

6. **Controlled Load** (if relevant)
   - "Hot water: 21.5c/kWh"

## MISSING FIELDS TO ADD TO SCHEMA

```prisma
// Add to EnergyPlan model:

// Incentives (💰 ROI Impact)
incentives          String?              // JSON array of incentives

// Enhanced discounts (currently basic)
discounts           String?              // JSON array of ALL discounts with full details

// Enhanced fees (currently only 4 types)
fees                String?              // JSON array of ALL fees

// Contract details
coolingOffDays      Int?                 // Cooling off period
billFrequency       String?              // P1M, P3M, etc.
paymentOptions      String?              // JSON array
onExpiryDescription String?              // What happens at end
variationTerms      String?              // Can they change rates?

// Green power details
greenPowerDetails   String?              // JSON with full scheme details

// Controlled loads
controlledLoads     String?              // JSON array of all controlled load options
```
