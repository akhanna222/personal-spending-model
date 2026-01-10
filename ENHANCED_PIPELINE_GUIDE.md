# Enhanced Transaction Analysis Pipeline

## 🎯 Complete Flow

```
Multi-page PDF/Image
        ↓
   GPT-4 Vision API
   (Extract transactions)
        ↓
   Structured JSON
        ↓
   Plaid Categories
   (Standardized taxonomy)
        ↓
   LLM Behavioral Analysis
   (Detect red flags)
        ↓
   Enhanced Transactions
   (Ready for dashboard)
```

---

## 🚀 Quick Start

### 1. Upload Bank Statement with Enhanced Pipeline

**Endpoint**: `POST /api/upload-enhanced`

**Supports**:
- ✅ Multi-page PDFs
- ✅ Scanned images (PNG, JPG)
- ✅ Complex layouts
- ✅ Handwritten annotations
- ✅ Multiple statements at once

**Request**:
```bash
curl -X POST http://localhost:3001/api/upload-enhanced \
  -F "statements=@bank-statement.pdf" \
  -F "usePlaid=true" \
  -F "analyzeBehavior=true" \
  -F "llmProvider=openai"
```

**Response**:
```json
{
  "success": true,
  "results": [
    {
      "fileName": "bank-statement.pdf",
      "success": true,
      "transactionCount": 87,
      "dateRange": {
        "start": "2024-01-01",
        "end": "2024-01-31"
      },
      "summary": {
        "totalTransactions": 87,
        "flaggedTransactions": 12,
        "highRiskTransactions": 3,
        "avgHealthScore": 68.5,
        "extractionValid": true
      },
      "bankName": "HSBC",
      "accountNumber": "****5678"
    }
  ],
  "totalTransactions": 87,
  "pipeline": {
    "vision": true,
    "plaid": true,
    "behavioral": true,
    "llmProvider": "openai"
  }
}
```

---

## 📋 Pipeline Stages

### Stage 1: GPT-4 Vision Extraction

**What it does**:
- Extracts transactions from PDF/image using computer vision
- Handles multi-page documents automatically
- OCR for scanned documents
- Extracts metadata (account number, bank name, dates)

**Technology**: OpenAI GPT-4o Vision API

**Output**:
```json
{
  "transactions": [
    {
      "id": "uuid-1234",
      "date": "2024-01-15",
      "amount": -45.67,
      "currency": "GBP",
      "rawDescription": "SAINSBURYS STORE 1234",
      "isIncome": false
    }
  ],
  "metadata": {
    "accountNumber": "12345678",
    "bankName": "HSBC",
    "statementPeriod": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    }
  }
}
```

**File**: `backend/src/services/visionParser.ts`

**Key Functions**:
- `extractTransactionsWithVision()` - Main extraction function
- `extractMultiPageStatement()` - Handles multi-page PDFs
- `deduplicateTransactions()` - Removes duplicates
- `validateExtractedTransactions()` - Data quality checks

---

### Stage 2: Plaid Category Classification

**What it does**:
- Maps transactions to Plaid's standardized category taxonomy
- Provides industry-standard categorization
- Used by thousands of fintech companies

**Technology**: OpenAI GPT-4o-mini + Plaid Taxonomy

**Plaid Category Hierarchy**:
```
PRIMARY CATEGORY
└── DETAILED CATEGORY

Examples:
FOOD_AND_DRINK
├── FOOD_AND_DRINK_GROCERIES
├── FOOD_AND_DRINK_RESTAURANT
├── FOOD_AND_DRINK_COFFEE
├── FOOD_AND_DRINK_FAST_FOOD
└── FOOD_AND_DRINK_BEER_WINE_AND_LIQUOR

ENTERTAINMENT
├── ENTERTAINMENT_CASINOS_AND_GAMBLING
├── ENTERTAINMENT_TV_AND_MOVIES
├── ENTERTAINMENT_MUSIC_AND_AUDIO
└── ENTERTAINMENT_VIDEO_GAMES

TRANSPORTATION
├── TRANSPORTATION_GAS
├── TRANSPORTATION_PUBLIC_TRANSIT
├── TRANSPORTATION_TAXIS_AND_RIDE_SHARES
└── TRANSPORTATION_PARKING
```

**16 Primary Categories**:
1. INCOME
2. TRANSFER_IN / TRANSFER_OUT
3. LOAN_PAYMENTS
4. BANK_FEES
5. ENTERTAINMENT
6. FOOD_AND_DRINK
7. GENERAL_MERCHANDISE
8. HOME_IMPROVEMENT
9. MEDICAL
10. PERSONAL_CARE
11. GENERAL_SERVICES
12. GOVERNMENT_AND_NON_PROFIT
13. TRANSPORTATION
14. TRAVEL
15. RENT_AND_UTILITIES

**Output**:
```json
{
  "plaidPrimaryCategory": "FOOD_AND_DRINK",
  "plaidDetailedCategory": "FOOD_AND_DRINK_GROCERIES",
  "plaidConfidence": 0.95,
  "plaidReasoning": "Sainsburys is a major UK grocery chain"
}
```

**File**: `backend/src/services/plaidCategories.ts`

**Key Functions**:
- `classifyToPlaidCategory()` - Single transaction classification
- `classifyBatchToPlaid()` - Batch processing
- `isValidPlaidCategory()` - Validate category combinations
- `getPlaidDetailedCategories()` - Get subcategories

---

### Stage 3: Behavioral Analysis

**What it does**:
- Analyzes spending patterns for red flags
- Detects problematic behaviors (gambling, late-night spending, etc.)
- Calculates health scores (0-100)
- Provides non-judgmental recommendations

**Technology**: OpenAI GPT-4o-mini / Claude Sonnet (contextual reasoning)

**Behavioral Red Flags Detected**:

#### 🎰 Gambling & Betting
- `GAMBLING_FREQUENT` - Regular betting activity
- `GAMBLING_ESCALATING` - Increasing bet amounts
- `GAMBLING_CHASE` - Pattern of losses → higher bets

#### ☕ Lifestyle Excess
- `LIFESTYLE_EXCESS_COFFEE` - Daily coffee shop (£1,000+/year)
- `LIFESTYLE_EXCESS_DELIVERY` - Frequent food delivery
- `LIFESTYLE_EXCESS_RIDESHARE` - Over-reliance on Uber

#### 💳 Debt Traps
- `DEBT_PAYDAY_LOAN` - **CRITICAL** - Payday loan detected
- `DEBT_BNPL_OVERUSE` - Buy-now-pay-later abuse
- `DEBT_OVERDRAFT` - Regular overdraft fees

#### 🛍️ Impulse Spending
- `IMPULSE_LATE_NIGHT` - **11pm-3am purchases**
- `IMPULSE_EMOTIONAL` - Stress-related spending patterns
- `IMPULSE_LUXURY` - Beyond normal spending level

#### 📱 Subscription Waste
- `SUBSCRIPTION_FORGOTTEN` - Unused subs (>3 months)
- `SUBSCRIPTION_DUPLICATE` - Multiple similar services
- `SUBSCRIPTION_EXPENSIVE` - High-cost rarely-used

#### 🍺 Substance & Adult
- `SUBSTANCE_ALCOHOL_FREQUENT` - Frequent alcohol
- `SUBSTANCE_SMOKING` - Regular tobacco/vaping
- `ADULT_CONTENT` - Adult entertainment services

**Output**:
```json
{
  "behaviorRedFlags": [
    {
      "flagType": "IMPULSE_LATE_NIGHT",
      "severity": "MEDIUM",
      "description": "Late-night online purchase at 11:45 PM",
      "recommendation": "Consider implementing a 24-hour rule for non-essential purchases",
      "potentialSavings": 50.0,
      "alternative": "Wait until morning to decide if purchase is necessary"
    }
  ],
  "riskLevel": "MEDIUM",
  "healthScore": 72,
  "behaviorClassification": "NEUTRAL",
  "interventionNeeded": false
}
```

**File**: `backend/src/services/behavioralAnalyzer.ts`

**Key Functions**:
- `analyzeTransactionBehavior()` - Single transaction analysis
- `analyzeBatchWithBehavior()` - Batch processing
- `aggregateBehavioralRisks()` - Portfolio-level insights

---

## 🔧 Configuration

### Environment Variables

```bash
# OpenAI API Key (required for Vision + Plaid + Behavioral)
OPENAI_API_KEY=sk-...

# Anthropic API Key (optional, for Claude behavioral analysis)
ANTHROPIC_API_KEY=sk-ant-...

# LLM Provider (optional, defaults to "openai")
LLM_PROVIDER=openai  # or "claude"
```

### Pipeline Options

When calling `/api/upload-enhanced`, you can configure:

```bash
# Enable/disable Plaid categorization
usePlaid=true  # default: true

# Enable/disable behavioral analysis
analyzeBehavior=true  # default: true

# Choose LLM provider for behavioral analysis
llmProvider=openai  # or "claude"
```

**Example**:
```bash
# Vision + Plaid only (no behavioral)
curl -X POST http://localhost:3001/api/upload-enhanced \
  -F "statements=@statement.pdf" \
  -F "usePlaid=true" \
  -F "analyzeBehavior=false"

# Vision + Behavioral only (no Plaid)
curl -X POST http://localhost:3001/api/upload-enhanced \
  -F "statements=@statement.pdf" \
  -F "usePlaid=false" \
  -F "analyzeBehavior=true"

# Vision only (fastest, cheapest)
curl -X POST http://localhost:3001/api/upload-enhanced \
  -F "statements=@statement.pdf" \
  -F "usePlaid=false" \
  -F "analyzeBehavior=false"
```

---

## 💰 Cost Analysis

### Per 100 Transactions

| Stage | Model | Cost | Time |
|-------|-------|------|------|
| **Vision Extraction** | GPT-4o | $0.30 | 5-10s |
| **Plaid Classification** | GPT-4o-mini | $0.15 | 30-60s |
| **Behavioral Analysis** | GPT-4o-mini | $0.15 | 30-60s |
| **TOTAL (Full Pipeline)** | - | **$0.60** | **60-120s** |

### Cost Optimization

**Option 1: Vision + Plaid** (Skip Behavioral)
- Cost: $0.45 per 100 transactions
- Use case: Basic categorization without red flags

**Option 2: Vision + Behavioral** (Skip Plaid)
- Cost: $0.45 per 100 transactions
- Use case: Red flag detection with custom categories

**Option 3: Vision Only**
- Cost: $0.30 per 100 transactions
- Use case: Just extract transactions, classify later

**Option 4: Use Claude for Behavioral**
- Cost: $0.60 per 100 transactions (similar)
- Benefit: Slightly more nuanced behavioral analysis

---

## 📊 Complete Transaction Object

After enhanced pipeline processing, each transaction has:

```typescript
{
  // Original data
  id: "uuid",
  date: "2024-01-15",
  amount: -45.67,
  currency: "GBP",
  rawDescription: "BET365 SPORTS BETTING",
  isIncome: false,

  // Enhanced description
  enhancedDescription: "Sports betting at Bet365",
  merchant: "Bet365",
  channel: "online",

  // Plaid categories
  plaidPrimaryCategory: "ENTERTAINMENT",
  plaidDetailedCategory: "ENTERTAINMENT_CASINOS_AND_GAMBLING",
  plaidConfidence: 0.98,

  // Our custom categories (optional)
  primaryCategory: "ENTERTAINMENT",
  detailedCategory: "ENTERTAINMENT_GAMBLING",
  categoryConfidence: 0.95,

  // Behavioral analysis
  behaviorRedFlags: [
    {
      flagType: "GAMBLING_FREQUENT",
      severity: "HIGH",
      description: "Regular sports betting activity detected",
      recommendation: "Consider self-exclusion tools or GambleAware support",
      potentialSavings: 200.0,
      resourcesAvailable: "GambleAware.org"
    }
  ],
  riskLevel: "HIGH",
  healthScore: 40,
  behaviorClassification: "PROBLEMATIC",
  interventionNeeded: true
}
```

---

## 🔄 Migration from Legacy Parser

### Legacy Flow (Text-based)
```
PDF/CSV → pdf-parse/papaparse → Transactions
```

**Limitations**:
- ❌ Can't handle scanned images
- ❌ Fails on complex layouts
- ❌ No multi-page support for images
- ❌ Requires specific CSV formats

### Enhanced Flow (Vision-based)
```
PDF/Image → GPT-4 Vision → Transactions → Plaid → Behavioral
```

**Benefits**:
- ✅ Handles any format
- ✅ Multi-page PDFs
- ✅ Scanned documents
- ✅ Standardized categories
- ✅ Behavioral insights

### Both Endpoints Available

**Legacy**: `POST /api/upload` (text-based parser)
**Enhanced**: `POST /api/upload-enhanced` (Vision pipeline)

You can use both! Enhanced pipeline is recommended for:
- Scanned bank statements
- Non-standard formats
- When you need Plaid categories
- When you need behavioral analysis

Use legacy parser for:
- Known CSV formats
- Cost optimization (free parsing)
- Simple transactions

---

## 🧪 Testing

### Test with Sample Statement

```bash
# 1. Start backend
cd backend
npm run dev

# 2. Upload sample statement
curl -X POST http://localhost:3001/api/upload-enhanced \
  -F "statements=@../sample-data/sample-statement.pdf" \
  -F "usePlaid=true" \
  -F "analyzeBehavior=true" \
  -F "llmProvider=openai"

# 3. Get transactions with behavioral data
curl http://localhost:3001/api/transactions | jq .

# 4. Get behavioral risk summary
curl http://localhost:3001/api/behavioral-risks | jq .
```

### Expected Output

```json
{
  "success": true,
  "results": [{
    "fileName": "sample-statement.pdf",
    "success": true,
    "transactionCount": 25,
    "summary": {
      "totalTransactions": 25,
      "flaggedTransactions": 8,
      "highRiskTransactions": 2,
      "avgHealthScore": 71.2,
      "extractionValid": true
    }
  }],
  "pipeline": {
    "vision": true,
    "plaid": true,
    "behavioral": true,
    "llmProvider": "openai"
  }
}
```

---

## 🎨 Frontend Integration

### Upload Component

```typescript
async function uploadBankStatement(file: File) {
  const formData = new FormData();
  formData.append('statements', file);
  formData.append('usePlaid', 'true');
  formData.append('analyzeBehavior', 'true');
  formData.append('llmProvider', 'openai');

  const response = await fetch('/api/upload-enhanced', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();

  if (result.success) {
    console.log(`Processed ${result.totalTransactions} transactions`);
    console.log(`Flagged: ${result.results[0].summary.flaggedTransactions}`);
    console.log(`Health Score: ${result.results[0].summary.avgHealthScore}/100`);
  }
}
```

### Display Behavioral Flags

```typescript
function TransactionRow({ transaction }) {
  const hasFalgs = transaction.behaviorRedFlags?.length > 0;

  return (
    <div className="transaction-row">
      <div className="description">
        {transaction.enhancedDescription}
        {hasFalgs && (
          <span className="red-flag-badge">
            ⚠️ {transaction.behaviorRedFlags.length} flag(s)
          </span>
        )}
      </div>

      {hasFalgs && (
        <div className="flags">
          {transaction.behaviorRedFlags.map(flag => (
            <div key={flag.flagType} className={`flag severity-${flag.severity.toLowerCase()}`}>
              <strong>{flag.description}</strong>
              <p>{flag.recommendation}</p>
              {flag.potentialSavings && (
                <p>Potential savings: £{flag.potentialSavings}/month</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🚨 Error Handling

### Validation Errors

If Vision extraction fails validation:

```json
{
  "validation": {
    "valid": false,
    "errors": [
      "Transaction 5: Invalid date format '15/Jan'",
      "Transaction 12: Empty description"
    ]
  }
}
```

**Solution**: Check PDF quality, rescan document, or use legacy parser

### API Errors

```json
{
  "error": "Failed to extract transactions with Vision: Invalid API key"
}
```

**Common Issues**:
1. Missing OPENAI_API_KEY
2. Insufficient API quota
3. Unsupported file format
4. File too large (>50MB)

---

## 📖 API Reference

### POST /api/upload-enhanced

**Request**:
- `statements`: File(s) - PDF or image
- `usePlaid`: boolean (default: true)
- `analyzeBehavior`: boolean (default: true)
- `llmProvider`: "openai" | "claude" (default: "openai")

**Response**:
```typescript
{
  success: boolean;
  results: Array<{
    fileName: string;
    success: boolean;
    transactionCount: number;
    dateRange: { start: string; end: string };
    summary: {
      totalTransactions: number;
      flaggedTransactions: number;
      highRiskTransactions: number;
      avgHealthScore: number;
      extractionValid: boolean;
    };
    bankName?: string;
    accountNumber?: string; // Last 4 digits
  }>;
  totalTransactions: number;
  pipeline: {
    vision: boolean;
    plaid: boolean;
    behavioral: boolean;
    llmProvider: string;
  };
}
```

---

## 🎯 Summary

The Enhanced Pipeline provides:

1. **Universal Document Support**: Any PDF/image format
2. **Standardized Categories**: Plaid taxonomy
3. **Behavioral Insights**: Red flags, health scores
4. **Complete Automation**: No manual categorization
5. **Cost-Effective**: $0.60 per 100 transactions

**Use Cases**:
- ✅ Personal finance apps
- ✅ Expense tracking
- ✅ Financial wellness platforms
- ✅ Behavioral coaching apps
- ✅ Budgeting tools

**Next Steps**:
1. Test with your bank statements
2. Integrate frontend components
3. Configure alerts for high-risk transactions
4. Build dashboard with health scores
