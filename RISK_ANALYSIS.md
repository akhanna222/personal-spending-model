# 🔍 AI-Powered Behavioral Risk Analysis

**Self-learning system that detects risky spending patterns and evolves based on your feedback.**

---

## 🎯 Overview

The Behavioral Risk Analyzer uses GPT-4o to:
1. **Detect** risky spending patterns in your transactions
2. **Learn** from your feedback (what's useful vs not useful)
3. **Evolve** pattern detection to match your preferences
4. **Alert** you to concerning behaviors before they become problems

**Key Feature:** The system gets smarter over time based on YOUR feedback!

---

## 🧠 How It Works

### 1. Pattern Detection (AI-Powered)

```
Your Transactions → GPT-4o Analysis → Risk Patterns Detected
                        ↓
              Historical Feedback Context
```

The AI considers:
- ✅ Transaction data (amounts, categories, dates)
- ✅ Your historical feedback (what you found useful)
- ✅ Pattern templates (that have worked for others)
- ✅ Confidence scores (how sure the AI is)

### 2. User Feedback Loop

```
Pattern Shown → User Feedback → Learning System Updates
                                        ↓
                              Future Detection Improves
```

Each time you provide feedback:
- ✅ Pattern templates learn what you care about
- ✅ Success rates update
- ✅ Future patterns adapt to your preferences
- ✅ Irrelevant patterns get deprioritized

### 3. Pattern Evolution

```
Successful Patterns → AI Analysis → New Pattern Types
       +                              ↓
User Notes          →           Better Thresholds
```

The system evolves by:
- Creating new pattern types from successful detections
- Adjusting thresholds based on feedback
- Combining patterns that work well together

---

## 📊 Built-in Risk Patterns

### Financial Health Patterns

#### 1. **Spending Spike** (Medium Severity)
- Detects when spending increases by >50% vs historical average
- Example: "You spent $800 on dining this month vs usual $400"

#### 2. **Income Drop** (High Severity)
- Detects when income decreases by >20%
- Example: "Income dropped from $5,000 to $3,500"

#### 3. **Debt Accumulation** (Critical Severity)
- Detects increasing loan payments or credit card charges
- Example: "Credit card payments up 30% for 2 months"

### Behavioral Red Flags

#### 4. **Subscription Creep** (Low Severity)
- Detects accumulation of recurring subscriptions
- Example: "You added 4 new subscriptions in 3 months"

#### 5. **Gambling Activity** (High Severity)
- Detects transactions to gambling platforms
- Example: "5 transactions to sports betting sites totaling $350"

### Unusual Activity

#### 6. **Unusual Merchant** (Medium Severity)
- Detects first-time large purchases
- Example: "First purchase of $1,200 at unknown merchant"

#### 7. **Time Anomaly** (Medium Severity)
- Detects unusual timing patterns
- Example: "Multiple 2 AM transactions totaling $500"

#### 8. **Category Shift** (Low Severity)
- Detects sudden changes in spending categories
- Example: "Entertainment spending up 200% this month"

---

## 🚀 API Usage

### 1. Analyze Transactions for Risks

```bash
POST /api/risks/analyze
Content-Type: application/json

{
  "userId": "user123",
  "transactions": [
    {
      "id": "tx1",
      "date": "2024-01-15",
      "transaction_text": "CASINO ROYALE",
      "payment_out": 500,
      ...
    },
    ...
  ]
}
```

**Response:**
```json
{
  "success": true,
  "userId": "user123",
  "patternsDetected": 3,
  "patterns": [
    {
      "id": "pattern_123",
      "type": "spending_spike",
      "severity": "high",
      "title": "Dining Spending Spike",
      "description": "Dining spending increased 85% compared to 3-month average",
      "confidence": 0.92,
      "pattern": {
        "timeframe": "last 30 days",
        "transactions": ["tx1", "tx2", "tx3"],
        "indicators": [
          {
            "name": "average_spending",
            "value": 400,
            "threshold": 600,
            "comparison": "above"
          },
          {
            "name": "current_spending",
            "value": 740,
            "threshold": 600,
            "comparison": "above"
          }
        ],
        "context": "Your dining expenses have been significantly higher than usual..."
      },
      "recommendations": [
        "Set a monthly dining budget of $500",
        "Track dining expenses weekly",
        "Consider meal prepping 2-3 days per week"
      ]
    }
  ],
  "summary": {
    "critical": 0,
    "high": 1,
    "medium": 1,
    "low": 1
  }
}
```

---

### 2. Get User's Risk Patterns

```bash
GET /api/risks/patterns/:userId
# Optional: ?withFeedback=true (only show patterns with feedback)
```

**Response:**
```json
{
  "userId": "user123",
  "patterns": [...],
  "total": 5,
  "pendingFeedback": 2
}
```

---

### 3. Submit Feedback on a Pattern

```bash
POST /api/risks/feedback
Content-Type: application/json

{
  "userId": "user123",
  "patternId": "pattern_123",
  "isAccurate": true,
  "isRelevant": true,
  "notes": "Very helpful! I didn't realize I was spending so much on dining."
}
```

**Feedback Options:**
- `isAccurate`: Was the detection correct?
- `isRelevant`: Is this something you care about?
- `notes`: (Optional) Additional context

**The system learns:**
- ✅ `accurate + relevant` → Pattern type gets boosted
- ❌ `not accurate` → Pattern type gets deprioritized
- ❌ `not relevant` → Similar patterns shown less often

---

### 4. Evolve Patterns Based on Feedback

```bash
POST /api/risks/evolve/:userId
```

Triggers the AI to:
- Analyze successful patterns
- Create new pattern types
- Adjust thresholds
- Improve detection accuracy

**Response:**
```json
{
  "success": true,
  "message": "Patterns evolved based on your feedback",
  "templates": [
    {
      "name": "Dining Spending Spike",
      "type": "spending_spike",
      "successRate": 0.85,
      "learningScore": 0.9,
      "totalDetections": 10
    },
    ...
  ]
}
```

---

### 5. Get Pattern Templates (Analytics)

```bash
GET /api/risks/templates
```

See how well each pattern type is performing:

```json
{
  "templates": [
    {
      "name": "Spending Spike",
      "successRate": 0.75,
      "learningScore": 0.8,
      "totalDetections": 20,
      "accurateFeedbacks": 15
    },
    ...
  ]
}
```

---

### 6. Get Risk Statistics

```bash
GET /api/risks/stats/:userId
```

**Response:**
```json
{
  "totalPatterns": 12,
  "bySeverity": {
    "critical": 1,
    "high": 3,
    "medium": 5,
    "low": 3
  },
  "withFeedback": 8,
  "accurateDetections": 6,
  "avgConfidence": 0.82,
  "byType": {
    "spending_spike": 4,
    "subscription_creep": 3,
    "income_drop": 1,
    ...
  }
}
```

---

### 7. Dismiss a Pattern

```bash
DELETE /api/risks/pattern/:userId/:patternId
```

Permanently remove a pattern you don't want to see.

---

## 💡 Example User Flow

### Week 1: First Analysis

```bash
# 1. User uploads transactions
POST /api/upload
[statement.pdf]

# 2. Run risk analysis
POST /api/risks/analyze
{
  "userId": "alice",
  "transactions": [...] # From upload
}

# Response: 3 patterns detected
# - Spending spike (dining) - HIGH
# - New subscription - LOW
# - Unusual late-night purchase - MEDIUM
```

### Week 1: User Provides Feedback

```bash
# Pattern 1: "Spending spike" - Useful!
POST /api/risks/feedback
{
  "patternId": "p1",
  "isAccurate": true,
  "isRelevant": true,
  "notes": "Didn't realize I was overspending on dining"
}

# Pattern 2: "New subscription" - Not useful
POST /api/risks/feedback
{
  "patternId": "p2",
  "isAccurate": true,
  "isRelevant": false,
  "notes": "I intentionally added this subscription"
}

# Pattern 3: "Late-night purchase" - False alarm
POST /api/risks/feedback
{
  "patternId": "p3",
  "isAccurate": false,
  "isRelevant": false,
  "notes": "That was just a midnight snack order"
}
```

### Week 2: System Has Learned

```bash
# Run analysis again with new month's data
POST /api/risks/analyze
{
  "userId": "alice",
  "transactions": [...]
}

# AI now knows:
# ✅ Alice cares about spending spikes
# ❌ Alice doesn't care about late-night purchases
# ❌ Alice intentionally adds subscriptions

# Response: More relevant patterns!
# - Dining spending still high - HIGH (because she cared last time)
# - No subscription alerts (she marked as not relevant)
# - No late-night alerts (she marked as not accurate)
# - NEW: Grocery spending increased - MEDIUM (learned pattern)
```

### Month 3: Patterns Evolve

```bash
# Evolve patterns based on feedback
POST /api/risks/evolve/alice

# AI creates NEW pattern types based on Alice's interests:
# - "Dining + Grocery combined spike" (learned from her feedback)
# - "Weekend entertainment spending" (noticed correlation)
# - Custom thresholds adjusted for Alice's spending habits
```

---

## 🎨 Frontend Integration Example

```typescript
// 1. Analyze risks after upload
const analyzeRisks = async (userId: string, transactions: Transaction[]) => {
  const response = await fetch('/api/risks/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, transactions })
  });

  const { patterns } = await response.json();
  return patterns;
};

// 2. Display patterns to user
const RiskAlert = ({ pattern }: { pattern: RiskPattern }) => (
  <div className={`alert alert-${pattern.severity}`}>
    <h3>{pattern.title}</h3>
    <p>{pattern.description}</p>

    {/* Show indicators */}
    <ul>
      {pattern.pattern.indicators.map(ind => (
        <li key={ind.name}>
          {ind.name}: {ind.value} ({ind.comparison} threshold of {ind.threshold})
        </li>
      ))}
    </ul>

    {/* Show recommendations */}
    <div className="recommendations">
      <h4>Recommendations:</h4>
      {pattern.recommendations.map((rec, i) => (
        <div key={i}>✓ {rec}</div>
      ))}
    </div>

    {/* Feedback buttons */}
    <div className="feedback-buttons">
      <button onClick={() => submitFeedback(pattern.id, true, true)}>
        👍 Useful
      </button>
      <button onClick={() => submitFeedback(pattern.id, true, false)}>
        Not Relevant
      </button>
      <button onClick={() => submitFeedback(pattern.id, false, false)}>
        False Alarm
      </button>
    </div>
  </div>
);

// 3. Submit feedback
const submitFeedback = async (
  patternId: string,
  isAccurate: boolean,
  isRelevant: boolean
) => {
  await fetch('/api/risks/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      patternId,
      isAccurate,
      isRelevant
    })
  });
};
```

---

## 🔒 Privacy & Storage

### Current Implementation (In-Memory)

**Data stored per user:**
- Risk patterns detected
- User feedback on patterns
- Pattern templates (shared across users)

**Note:** This is in-memory storage for demo purposes.

### Production Recommendations

```typescript
// Use a database for production
interface UserRiskData {
  userId: string;
  patterns: RiskPattern[];
  feedback: Map<patternId, Feedback>;
  preferences: {
    sensitivities: Record<PatternType, number>;
    disabledPatterns: string[];
  };
}

// Store in PostgreSQL, MongoDB, or similar
```

**Security:**
- Encrypt sensitive financial data
- Store patterns separately from transactions
- Allow users to delete their risk history
- GDPR compliance: right to be forgotten

---

## 📈 Learning Metrics

### Pattern Template Scores

Each pattern type tracks:
- **Success Rate**: % of detections that got positive feedback
- **Learning Score**: 0-1, increases with positive feedback
- **Total Detections**: How many times pattern was detected
- **Accurate Feedbacks**: How many were marked accurate

**Example:**
```json
{
  "name": "Spending Spike",
  "successRate": 0.75,      // 75% of users found it useful
  "learningScore": 0.85,    // High confidence in this pattern
  "totalDetections": 100,   // Shown 100 times
  "accurateFeedbacks": 75   // 75 positive feedbacks
}
```

### User-Specific Learning

Each detected pattern has:
- **Confidence**: 0-1, how sure the AI is
- **Learning Score**: Increases if user validates it
- **Version**: Tracks pattern evolution
- **Parent Pattern**: If evolved from another pattern

---

## 🚨 Alert Severity Levels

| Level | When to Use | Action |
|-------|-------------|--------|
| **Critical** | Immediate financial danger | Red alert, email notification |
| **High** | Significant risk | Orange alert, dashboard highlight |
| **Medium** | Concerning trend | Yellow alert, weekly summary |
| **Low** | Informational | Blue badge, monthly report |

---

## 🎯 Best Practices

### For Users

1. **Provide Honest Feedback**
   - Mark patterns as "not useful" if you don't care
   - Explain why in notes (helps AI learn faster)

2. **Review Regularly**
   - Check risk dashboard weekly
   - Submit feedback on at least 5 patterns to train the system

3. **Act on Critical Alerts**
   - Take action on high/critical severity patterns
   - Use the recommendations provided

4. **Evolve Periodically**
   - Run `/api/risks/evolve` monthly
   - Review pattern templates quarterly

### For Developers

1. **Rate Limiting**
   - Risk analysis is LLM-intensive
   - Cache results for 24 hours
   - Batch analyze transactions

2. **Background Processing**
   - Run risk analysis async after upload
   - Notify user when complete

3. **Database**
   - Store patterns in DB, not memory
   - Index by userId and severity
   - Soft delete patterns (keep for learning)

4. **Monitoring**
   - Track pattern success rates
   - Monitor LLM costs
   - Alert on low success rates

---

## 💰 Cost Considerations

### Per Analysis (100 transactions)

- GPT-4o analysis: ~$0.02
- Function calling: included
- Pattern storage: minimal

### Optimization Tips

1. **Batch Analyze**
   - Analyze monthly, not daily
   - Process 100+ transactions at once

2. **Cache Results**
   - Store detected patterns for 24 hours
   - Only re-analyze on new data

3. **Use Feedback**
   - Fewer false positives = fewer re-analyses
   - Better patterns = happier users

---

## 🔮 Future Enhancements

- [ ] **Real-time Alerts**: WebSocket notifications
- [ ] **Pattern Sharing**: Learn from similar users (privacy-preserving)
- [ ] **Predictive Alerts**: "You're likely to overspend next week"
- [ ] **Goal Integration**: "This spending spike affects your savings goal"
- [ ] **Automated Actions**: "Automatically transfer $X to savings when income spikes"
- [ ] **Multi-user Comparison**: "95% of users in your income bracket spend less on..."

---

## 📚 Related Documentation

- `VISION_APPROACH.md` - Vision-first extraction
- `OPTIMIZATION.md` - Performance optimizations
- `README.md` - Complete system overview

---

## 🎉 You're Ready!

### Quick Start

```bash
# 1. Start server (choose Vision mode)
./run.sh

# 2. Run comprehensive tests (includes risk analysis!)
./test-full.sh
```

The test suite validates:
- ✅ Risk pattern detection (10+ built-in patterns)
- ✅ Learning system with feedback loop
- ✅ Pattern storage per user
- ✅ Analytics and statistics
- ✅ All API endpoints functional

### Manual Testing

```bash
# 1. Upload transactions
curl -X POST http://localhost:3001/api/upload \
  -F "statements=@statement.pdf"

# 2. Get extracted transactions
TRANSACTIONS=$(curl -s http://localhost:3001/api/transactions | jq '.transactions')

# 3. Analyze risks
curl -X POST http://localhost:3001/api/risks/analyze \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"me\", \"transactions\":$TRANSACTIONS}"

# 4. View detected patterns
curl http://localhost:3001/api/risks/patterns/me | jq

# 5. Submit feedback (teach the system!)
curl -X POST http://localhost:3001/api/risks/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "me",
    "patternId": "<pattern-id-from-step-4>",
    "feedback": {
      "isAccurate": true,
      "isRelevant": true,
      "isActionable": true,
      "notes": "Very helpful alert!"
    }
  }'

# 6. Check statistics
curl http://localhost:3001/api/risks/stats/me | jq
```

**The system learns from YOU!** 🧠

### Production Deployment

For production use:
1. Replace in-memory storage with PostgreSQL
2. Add user authentication (JWT/OAuth)
3. Set up background jobs for async analysis
4. Implement rate limiting on risk endpoints
5. Add real-time notifications (WebSocket/Push)
6. Build React dashboard for risk visualization
