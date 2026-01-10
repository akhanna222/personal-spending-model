import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Transaction, TransactionEnhancement, BehaviorRedFlag } from '../types';
import categoryData from '../../../shared/category-data.json';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const OPENAI_MODEL = 'gpt-4o-mini';
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';

/**
 * LLM-based behavioral analysis with intelligent red flag detection
 * Uses context and reasoning instead of hardcoded vendor lists
 */
export async function analyzeTransactionBehavior(
  transaction: Transaction,
  useOpenAI: boolean = true
): Promise<TransactionEnhancement> {
  const categoryChoices = categoryData.categories
    .filter(cat => transaction.isIncome ? cat.PRIMARY === 'INCOME' : cat.PRIMARY !== 'INCOME')
    .slice(0, 50)
    .map(cat => `${cat.PRIMARY} -> ${cat.DETAILED}: ${cat.DESCRIPTION}`)
    .join('\n');

  const systemPrompt = `You are an expert financial behavior analyst specializing in European consumer spending patterns.

Your role is to:
1. Analyze bank transaction descriptions to understand what was purchased and from whom
2. Categorize transactions into appropriate spending categories
3. **CRITICALLY**: Detect behavioral red flags that indicate problematic spending patterns
4. Assess financial health and risk levels
5. Provide actionable, non-judgmental recommendations

You have deep knowledge of:
- Gambling & betting patterns (sports betting, casino, lottery, FOBTs)
- Substance use indicators (alcohol, tobacco, cannabis where legal)
- Adult content spending (subscriptions, webcams, pay-per-view)
- Impulse shopping patterns (late-night purchases, fast fashion)
- Lifestyle inflation (excessive delivery, rideshare, coffee shops)
- Debt traps (payday loans, BNPL abuse, high-interest credit)
- Subscription creep (multiple unused services)
- European merchant patterns and cultural norms

**IMPORTANT**: Use contextual analysis and reasoning, NOT hardcoded vendor lists.
Analyze the transaction TEXT to infer behavior, don't just match names.

Return ONLY valid JSON.`;

  const timeOfDay = new Date(`${transaction.date}T12:00:00`).toLocaleTimeString('en-US', { hour: '2-digit' });

  const userPrompt = `Analyze this transaction for spending category AND behavioral red flags:

**Transaction Details:**
- Date: ${transaction.date}
- Time: Unknown (analyze if description suggests timing)
- Amount: ${transaction.currency} ${Math.abs(transaction.amount).toFixed(2)}
- Type: ${transaction.isIncome ? 'INCOME' : 'EXPENSE'}
- Description: "${transaction.rawDescription}"

**Your Task:**
1. **Categorization**: Match to PRIMARY and DETAILED category
2. **Merchant Analysis**: Extract merchant name and type
3. **Behavioral Analysis**: Detect ANY red flags in this transaction

**Available Categories:**
${categoryChoices}

**Behavioral Red Flags to Consider** (analyze contextually, don't just match keywords):

🎰 **GAMBLING INDICATORS:**
- Betting sites, bookmakers, casinos, lottery (analyze frequency if mentioned)
- Keywords: bet, casino, poker, lottery, gaming, wager
- Risk factors: Online gambling, sports betting, slot machines

🔞 **ADULT CONTENT:**
- Subscription services for adult content, webcam sites, dating
- Keywords: onlyfans, fansly, chaturbate, adult, webcam, xxx
- Privacy concern + financial impact

☕ **LIFESTYLE EXCESS:**
- Daily coffee shops, frequent food delivery, rideshare overuse
- Keywords: starbucks, costa, uber eats, deliveroo, uber, bolt
- Micro-spending that accumulates

🍺 **ALCOHOL/SUBSTANCE:**
- Bars, pubs, liquor stores, off-licenses
- Keywords: pub, bar, liquor, wine, spirits, coffeeshop (Netherlands context)
- Frequency and amount matter

🛍️ **IMPULSE SHOPPING:**
- Fast fashion, late-night online shopping, luxury beyond means
- Keywords: amazon, asos, shein, zara, luxury brands
- Check if amount seems excessive for category

💳 **DEBT TRAPS:**
- Payday loans, pawnbrokers, BNPL services, rent-to-own
- Keywords: klarna, clearpay, payday, cash converters, brighthouse
- **CRITICAL** severity if detected

🎮 **GAMING ADDICTION:**
- Loot boxes, microtransactions, multiple gaming subscriptions
- Keywords: EA, steam, playstation, xbox, in-app purchase, gems, coins

📱 **SUBSCRIPTION CREEP:**
- Multiple streaming services, unused gym memberships
- Keywords: netflix, spotify, gym, subscription

**Response Format (JSON):**
{
  "enhancedDescription": "Clear human-readable description",
  "merchant": "Merchant name or null",
  "channel": "online" | "in-store" | "subscription" | "unknown",
  "purpose": "Transaction purpose",
  "primaryCategory": "PRIMARY_CATEGORY",
  "detailedCategory": "DETAILED_CATEGORY",
  "confidence": 0.0-1.0,
  "reasoning": "Why you chose this category",

  "behaviorRedFlags": [
    {
      "flagType": "SPECIFIC_FLAG_NAME",
      "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "description": "What the red flag is",
      "recommendation": "Specific actionable advice",
      "potentialSavings": 0,
      "alternative": "Better option if applicable",
      "resourcesAvailable": "Help resources if needed"
    }
  ],
  "riskLevel": "HEALTHY" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "healthScore": 0-100,
  "behaviorClassification": "GOOD" | "NEUTRAL" | "CONCERNING" | "PROBLEMATIC",
  "interventionNeeded": true/false
}

**Scoring Guidelines:**
- healthScore 85-100: Normal spending, no concerns
- healthScore 70-84: Minor optimization opportunities
- healthScore 50-69: Concerning patterns, needs attention
- healthScore 30-49: Problematic behavior, intervention recommended
- healthScore 0-29: Critical issues, immediate help needed

**Red Flag Detection Logic:**
- If NO red flags detected: empty array, "HEALTHY" risk, 85+ health score, "GOOD" classification
- If minor lifestyle waste (coffee, delivery): "LOW" risk, 70-84 score, "NEUTRAL" classification
- If impulse/excess spending: "MEDIUM" risk, 50-69 score, "CONCERNING" classification
- If gambling/adult/substance: "HIGH" risk, 30-49 score, "PROBLEMATIC" classification
- If payday loans/debt traps: "CRITICAL" risk, 0-29 score, "PROBLEMATIC" + intervention = true

**Important:**
- Be contextual: A single Starbucks is fine, daily pattern is concerning
- Be specific: Don't say "gambling" - say which type and why it's concerning
- Be helpful: Always provide actionable recommendations
- Be non-judgmental: Focus on financial impact, not morality
- Consider European context: Legal status, cultural norms vary by country`;

  try {
    let responseText: string;

    if (useOpenAI) {
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 1500,
      });
      responseText = response.choices[0].message.content || '{}';
    } else {
      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: systemPrompt + '\n\n' + userPrompt,
        }],
      });
      const content = response.content[0];
      responseText = content.type === 'text' ? content.text : '{}';

      // Extract JSON from Claude's response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      responseText = jsonMatch ? jsonMatch[0] : '{}';
    }

    const result = JSON.parse(responseText);

    // Ensure all required fields exist with defaults
    return {
      enhancedDescription: result.enhancedDescription || transaction.rawDescription,
      merchant: result.merchant || undefined,
      channel: result.channel || 'unknown',
      purpose: result.purpose,
      primaryCategory: result.primaryCategory || (transaction.isIncome ? 'INCOME' : 'UNCATEGORIZED'),
      detailedCategory: result.detailedCategory || (transaction.isIncome ? 'INCOME_OTHER' : 'UNCATEGORIZED_UNKNOWN'),
      confidence: result.confidence || 0.5,
      reasoning: result.reasoning,

      // Behavioral fields
      behaviorRedFlags: result.behaviorRedFlags || [],
      riskLevel: result.riskLevel || 'HEALTHY',
      healthScore: result.healthScore || 85,
      behaviorClassification: result.behaviorClassification || 'GOOD',
      interventionNeeded: result.interventionNeeded || false,
    };

  } catch (error) {
    console.error('Error in behavioral analysis:', error);

    // Fallback response
    return {
      enhancedDescription: transaction.rawDescription,
      channel: 'unknown',
      primaryCategory: transaction.isIncome ? 'INCOME' : 'UNCATEGORIZED',
      detailedCategory: transaction.isIncome ? 'INCOME_OTHER' : 'UNCATEGORIZED_UNKNOWN',
      confidence: 0.1,
      reasoning: 'Analysis failed',
      behaviorRedFlags: [],
      riskLevel: 'HEALTHY',
      healthScore: 85,
      behaviorClassification: 'NEUTRAL',
      interventionNeeded: false,
    };
  }
}

/**
 * Batch analysis with behavioral detection
 */
export async function analyzeBatchWithBehavior(
  transactions: Transaction[],
  useOpenAI: boolean = true,
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, TransactionEnhancement>> {
  const results = new Map<string, TransactionEnhancement>();
  const batchSize = 3; // Slower due to more comprehensive analysis

  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);

    const promises = batch.map(async (txn) => {
      const enhancement = await analyzeTransactionBehavior(txn, useOpenAI);
      results.set(txn.id, enhancement);

      if (onProgress) {
        onProgress(i + batch.indexOf(txn) + 1, transactions.length);
      }
    });

    await Promise.all(promises);

    // Delay between batches
    if (i + batchSize < transactions.length) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  return results;
}

/**
 * Get aggregated behavioral insights across all transactions
 */
export function aggregateBehavioralRisks(
  enhancements: Map<string, TransactionEnhancement>
): {
  totalFlags: number;
  flagsBySeverity: { [key: string]: number };
  flagsByType: { [key: string]: number };
  overallRiskLevel: string;
  interventionsNeeded: number;
  averageHealthScore: number;
  criticalIssues: BehaviorRedFlag[];
} {
  let totalFlags = 0;
  const flagsBySeverity: { [key: string]: number } = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
  };
  const flagsByType: { [key: string]: number } = {};
  let interventionsNeeded = 0;
  let totalHealthScore = 0;
  let healthScoreCount = 0;
  const criticalIssues: BehaviorRedFlag[] = [];

  enhancements.forEach(enhancement => {
    if (enhancement.behaviorRedFlags) {
      totalFlags += enhancement.behaviorRedFlags.length;

      enhancement.behaviorRedFlags.forEach(flag => {
        flagsBySeverity[flag.severity] = (flagsBySeverity[flag.severity] || 0) + 1;
        flagsByType[flag.flagType] = (flagsByType[flag.flagType] || 0) + 1;

        if (flag.severity === 'CRITICAL') {
          criticalIssues.push(flag);
        }
      });
    }

    if (enhancement.interventionNeeded) {
      interventionsNeeded++;
    }

    if (enhancement.healthScore !== undefined) {
      totalHealthScore += enhancement.healthScore;
      healthScoreCount++;
    }
  });

  const averageHealthScore = healthScoreCount > 0 ? totalHealthScore / healthScoreCount : 85;

  let overallRiskLevel = 'HEALTHY';
  if (flagsBySeverity.CRITICAL > 0) overallRiskLevel = 'CRITICAL';
  else if (flagsBySeverity.HIGH > 2) overallRiskLevel = 'HIGH';
  else if (flagsBySeverity.MEDIUM > 5) overallRiskLevel = 'MEDIUM';
  else if (flagsBySeverity.LOW > 10) overallRiskLevel = 'LOW';

  return {
    totalFlags,
    flagsBySeverity,
    flagsByType,
    overallRiskLevel,
    interventionsNeeded,
    averageHealthScore: Math.round(averageHealthScore),
    criticalIssues,
  };
}
