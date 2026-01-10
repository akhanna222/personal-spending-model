# Behavioral Analysis API

## Overview

The SpendLens Behavioral Analysis system uses **LLM-based contextual reasoning** to analyze transaction text and detect behavioral red flags. Unlike hardcoded vendor lists, this system intelligently analyzes the transaction description, amount, frequency patterns, and context to identify concerning spending behaviors.

## Key Features

✅ **LLM-Powered Analysis**: Uses OpenAI or Claude to contextually analyze transactions
✅ **No Hardcoded Vendors**: Intelligently infers behavior from transaction text
✅ **Behavioral Red Flags**: Detects gambling, addiction, debt traps, lifestyle excess
✅ **Health Scoring**: 0-100 score indicating financial health
✅ **Risk Levels**: HEALTHY, LOW, MEDIUM, HIGH, CRITICAL
✅ **Actionable Recommendations**: Non-judgmental, solution-focused advice
✅ **Aggregated Insights**: Portfolio-level behavioral analysis

---

## API Endpoints

### 1. Analyze Transactions with Behavioral Detection

**Endpoint**: `POST /api/transactions/analyze-behavior`

Analyzes transactions using LLM to detect both category classification AND behavioral red flags.

**Request Body**:
```json
{
  "transactionIds": ["txn-1", "txn-2", "txn-3"],
  "llmProvider": "openai"  // or "claude" (optional, defaults to openai)
}
```

**Response**:
```json
{
  "success": true,
  "analyzed": 3,
  "behavioralInsights": {
    "overallHealthScore": 72,
    "overallRiskLevel": "MEDIUM",
    "flaggedTransactions": 1,
    "totalFlags": 2,
    "flagsByCategory": {
      "GAMBLING_FREQUENT": 1,
      "LIFESTYLE_EXCESS_COFFEE": 1
    },
    "criticalFlags": [],
    "highRiskFlags": [],
    "recommendations": [
      "Consider setting a monthly limit for coffee shop purchases",
      "Review gambling expenses and set strict limits"
    ]
  },
  "transactions": [
    {
      "id": "txn-1",
      "rawDescription": "BET365 SPORTS BETTING",
      "enhancedDescription": "Sports betting at Bet365",
      "primaryCategory": "ENTERTAINMENT",
      "detailedCategory": "ENTERTAINMENT_GAMBLING",
      "confidence": 0.95,
      "behaviorRedFlags": [
        {
          "flagType": "GAMBLING_FREQUENT",
          "severity": "HIGH",
          "description": "Regular sports betting activity detected",
          "recommendation": "Consider self-exclusion tools or GambleAware support",
          "potentialSavings": 200.0,
          "resourcesAvailable": "GambleAware.org, BeGambleAware.org"
        }
      ],
      "riskLevel": "HIGH",
      "healthScore": 40,
      "behaviorClassification": "PROBLEMATIC",
      "interventionNeeded": true
    }
  ]
}
```

---

### 2. Get Aggregated Behavioral Risks

**Endpoint**: `GET /api/behavioral-risks`

Returns portfolio-level behavioral analysis across all analyzed transactions.

**Response**:
```json
{
  "overallHealthScore": 78,
  "overallRiskLevel": "LOW",
  "flaggedTransactions": 5,
  "totalFlags": 8,
  "flagsByCategory": {
    "LIFESTYLE_EXCESS_COFFEE": 3,
    "IMPULSE_LATE_NIGHT": 2,
    "SUBSCRIPTION_FORGOTTEN": 3
  },
  "criticalFlags": [],
  "highRiskFlags": [
    "Gambling activity detected in multiple transactions"
  ],
  "recommendations": [
    "Review coffee spending: £45/week, £180/month potential savings",
    "Cancel unused subscriptions: £30/month savings identified"
  ],
  "totalTransactions": 250,
  "analyzedTransactions": 150
}
```

---

## Behavioral Red Flag Types

The system can detect the following behavioral patterns:

### 🎰 Gambling & Addiction
- `GAMBLING_FREQUENT`: Regular betting/casino activity
- `GAMBLING_ESCALATING`: Increasing bet amounts over time
- `GAMBLING_CHASE`: Pattern of losses followed by higher bets

### ☕ Lifestyle Excess
- `LIFESTYLE_EXCESS_COFFEE`: Daily coffee shop purchases (£1,000+/year)
- `LIFESTYLE_EXCESS_DELIVERY`: Frequent food delivery (3+ times/week)
- `LIFESTYLE_EXCESS_RIDESHARE`: Over-reliance on Uber/taxis

### 💳 Debt Traps
- `DEBT_PAYDAY_LOAN`: **CRITICAL** - Payday loan detected
- `DEBT_BNPL_OVERUSE`: Buy-now-pay-later abuse (4+ active)
- `DEBT_OVERDRAFT`: Regular overdraft fees

### 🛍️ Impulse Spending
- `IMPULSE_LATE_NIGHT`: Late-night purchases (11pm-3am)
- `IMPULSE_EMOTIONAL`: Pattern of stress-related spending
- `IMPULSE_LUXURY`: Purchases beyond typical spending level

### 📱 Subscription Waste
- `SUBSCRIPTION_FORGOTTEN`: Unused subscriptions (>3 months inactive)
- `SUBSCRIPTION_DUPLICATE`: Multiple similar services
- `SUBSCRIPTION_EXPENSIVE`: High-cost subscriptions rarely used

### 🍺 Substance & Adult Content
- `SUBSTANCE_ALCOHOL_FREQUENT`: Frequent alcohol purchases
- `SUBSTANCE_SMOKING`: Regular tobacco/vaping purchases
- `ADULT_CONTENT`: Adult entertainment services

---

## Health Score Calculation

**Score Range**: 0-100

| Score | Risk Level | Classification | Meaning |
|-------|-----------|----------------|---------|
| 90-100 | HEALTHY | GOOD | Excellent financial behavior |
| 70-89 | LOW | GOOD | Minor areas for improvement |
| 50-69 | MEDIUM | NEUTRAL | Some concerning patterns |
| 30-49 | HIGH | CONCERNING | Multiple red flags detected |
| 0-29 | CRITICAL | PROBLEMATIC | Urgent intervention needed |

**Calculation Logic**:
- Start with base score of 100
- Deduct points for each red flag:
  - CRITICAL severity: -25 points
  - HIGH severity: -15 points
  - MEDIUM severity: -8 points
  - LOW severity: -3 points
- Minimum score: 0

---

## How It Works: LLM-Based Contextual Analysis

Unlike traditional rule-based systems that match hardcoded vendor names, SpendLens uses LLM reasoning:

### Example 1: Gambling Detection

**Transaction**: `"PAYPAL *BETFAIR 23:45"`

**LLM Analysis**:
1. Recognizes "BETFAIR" as gambling platform
2. Notes late-night timestamp (11:45 PM)
3. Considers transaction amount and frequency
4. **Outputs**:
   - Category: `ENTERTAINMENT_GAMBLING`
   - Red Flag: `GAMBLING_FREQUENT` (HIGH severity)
   - Recommendation: "Consider self-exclusion tools"

### Example 2: Coffee Shop Excess

**Transaction**: `"STARBUCKS STORE #1234 £4.50"`

**LLM Analysis**:
1. Identifies as coffee shop purchase
2. Analyzes if part of pattern (frequency check)
3. Calculates potential annual cost
4. **Outputs**:
   - Category: `DINING_COFFEE_SHOP`
   - Red Flag: `LIFESTYLE_EXCESS_COFFEE` (MEDIUM severity)
   - Potential Savings: £1,170/year (£4.50 × 5 days × 52 weeks)
   - Alternative: "Brew coffee at home: save £900+/year"

### Example 3: Payday Loan (Critical)

**Transaction**: `"WONGA LOAN REPAYMENT £85.00"`

**LLM Analysis**:
1. Recognizes payday loan service
2. Flags as **CRITICAL** financial risk
3. Identifies debt trap pattern
4. **Outputs**:
   - Category: `FINANCIAL_SERVICES_LOAN`
   - Red Flag: `DEBT_PAYDAY_LOAN` (**CRITICAL** severity)
   - Recommendation: "Seek debt counseling immediately"
   - Resources: "StepChange.org, Citizens Advice"

---

## Configuration

### Environment Variables

```bash
# Choose LLM provider for behavioral analysis
LLM_PROVIDER=openai  # or "claude"

# API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Cost Considerations

**OpenAI (Recommended for Behavioral Analysis)**:
- Model: `gpt-4o-mini`
- Cost: ~$0.15 per 1,000 transactions
- Speed: Fast (500-800ms per transaction)

**Claude**:
- Model: `claude-3-5-sonnet-20241022`
- Cost: ~$0.45 per 1,000 transactions
- Speed: Fast (600-900ms per transaction)
- Accuracy: Slightly better for nuanced analysis

---

## Integration Example

### Frontend Integration

```typescript
// 1. Upload bank statements
const uploadResponse = await fetch('/api/upload', {
  method: 'POST',
  body: formData  // Contains CSV/PDF files
});

// 2. Get transaction IDs
const transactionsResponse = await fetch('/api/transactions');
const { transactions } = await transactionsResponse.json();
const transactionIds = transactions.map(t => t.id);

// 3. Analyze with behavioral detection
const analysisResponse = await fetch('/api/transactions/analyze-behavior', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    transactionIds,
    llmProvider: 'openai'
  })
});

const { behavioralInsights, transactions: analyzed } = await analysisResponse.json();

// 4. Display red flags in UI
analyzed.forEach(txn => {
  if (txn.behaviorRedFlags && txn.behaviorRedFlags.length > 0) {
    console.log(`⚠️ ${txn.enhancedDescription}`);
    txn.behaviorRedFlags.forEach(flag => {
      console.log(`   - ${flag.description} (${flag.severity})`);
      console.log(`   💡 ${flag.recommendation}`);
    });
  }
});

// 5. Show overall health score
console.log(`Health Score: ${behavioralInsights.overallHealthScore}/100`);
console.log(`Risk Level: ${behavioralInsights.overallRiskLevel}`);
```

---

## Privacy & Ethics

### Non-Judgmental Approach
- All messaging is **data-driven** and **solution-focused**
- No moral judgments about spending choices
- Focus on financial health, not personal choices
- Respect user autonomy

### Data Privacy
- All analysis happens server-side
- No transaction data stored in LLM provider logs (zero retention)
- User can delete all data via `DELETE /api/transactions`

### Transparency
- All red flag reasoning is exposed in API response
- Users can see exactly why a flag was triggered
- Confidence scores indicate analysis certainty

---

## Comparison: Old vs New Approach

| Feature | Old (Hardcoded Vendors) | New (LLM Contextual) |
|---------|------------------------|---------------------|
| Vendor Detection | List of 150+ vendors | Contextual text analysis |
| Maintainability | Requires constant updates | Self-adapting |
| Accuracy | Misses variations | High contextual accuracy |
| False Positives | Common | Rare |
| New Merchants | Missed | Detected automatically |
| Reasoning | Rule-based | Intelligent inference |
| Cost | Free | ~$0.15 per 1K transactions |

---

## Next Steps

### Frontend Integration
1. Update transaction list UI to display behavioral red flags
2. Add health score dashboard widget
3. Create behavioral insights page
4. Implement intervention modals for CRITICAL flags

### API Enhancements
1. Add filtering: `GET /api/transactions?riskLevel=HIGH`
2. Time-series behavioral trends
3. Peer comparison (anonymized benchmarks)
4. Behavioral forecast: "At current rate, gambling spend will reach..."

---

## Testing

### Sample Request

```bash
# Upload sample bank statement
curl -X POST http://localhost:3001/api/upload \
  -F "statements=@sample-statement.csv"

# Get transaction IDs
TRANSACTION_IDS=$(curl http://localhost:3001/api/transactions | jq -r '.transactions[].id' | jq -R . | jq -s .)

# Analyze with behavioral detection
curl -X POST http://localhost:3001/api/transactions/analyze-behavior \
  -H "Content-Type: application/json" \
  -d "{\"transactionIds\": $TRANSACTION_IDS, \"llmProvider\": \"openai\"}"

# Get aggregated risks
curl http://localhost:3001/api/behavioral-risks | jq .
```

---

## Troubleshooting

### Issue: "OPENAI_API_KEY not set"
**Solution**: Add `OPENAI_API_KEY=sk-...` to `backend/.env`

### Issue: "No transactions analyzed"
**Solution**: Call `/api/transactions/analyze-behavior` first before `/api/behavioral-risks`

### Issue: High costs
**Solution**: Use `gpt-4o-mini` instead of `gpt-4o`, or switch to Claude for batch processing

### Issue: Slow analysis
**Solution**: Behavioral analyzer processes 5 transactions in parallel. Increase batch size in `behavioralAnalyzer.ts` if needed.

---

## Summary

The SpendLens Behavioral Analysis system represents a shift from **rule-based** to **intelligence-based** financial behavior detection. By leveraging LLM reasoning, the system can:

✅ Detect problematic spending patterns without hardcoded vendor lists
✅ Provide contextual, non-judgmental recommendations
✅ Calculate health scores and risk levels
✅ Identify intervention opportunities
✅ Adapt to new merchants and spending patterns automatically

This approach scales better, requires less maintenance, and provides more accurate insights compared to traditional rule-based systems.
