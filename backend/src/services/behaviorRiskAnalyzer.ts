import OpenAI from 'openai';
import { Transaction } from '../types';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Risk Pattern Structure
 */
export interface RiskPattern {
  id: string;
  userId: string;
  type: 'spending_spike' | 'unusual_merchant' | 'time_anomaly' | 'category_shift' | 'income_drop' | 'debt_accumulation' | 'subscription_creep' | 'gambling' | 'cash_withdrawal' | 'foreign_transaction' | 'late_payment' | 'overdraft' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  confidence: number; // 0-1
  detectedAt: string;

  // Pattern details
  pattern: {
    timeframe: string; // e.g., "last 30 days"
    transactions: string[]; // Transaction IDs
    indicators: {
      name: string;
      value: number;
      threshold: number;
      comparison: 'above' | 'below' | 'unusual';
    }[];
    context: string; // AI-generated context
  };

  // Learning data
  userFeedback?: {
    isAccurate: boolean;
    isRelevant: boolean;
    notes?: string;
    submittedAt: string;
  };

  // Evolution tracking
  version: number;
  parentPatternId?: string; // If evolved from another pattern
  learningScore: number; // 0-1, increases with positive feedback

  // Suggested actions
  recommendations: string[];
}

/**
 * Pattern Learning System
 */
export interface PatternTemplate {
  id: string;
  type: string;
  name: string;
  description: string;
  detectionPrompt: string;
  indicators: string[];
  thresholds: Record<string, number>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  learningScore: number; // Improves with positive feedback
  successRate: number; // % of patterns that got positive feedback
  totalDetections: number;
  accurateFeedbacks: number;
}

/**
 * Behavioral Risk Analysis Service
 * Uses LLM to detect and learn risk patterns
 */
export class BehaviorRiskAnalyzer {
  private patternTemplates: PatternTemplate[] = [];
  private userPatterns: Map<string, RiskPattern[]> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize with common risk patterns
   */
  private initializeDefaultTemplates() {
    this.patternTemplates = [
      {
        id: 'spending_spike',
        type: 'spending_spike',
        name: 'Unusual Spending Spike',
        description: 'Spending is significantly higher than normal',
        detectionPrompt: 'Detect if spending in a category or overall has increased by more than 50% compared to historical average',
        indicators: ['average_spending', 'current_spending', 'spike_percentage'],
        thresholds: { spike_threshold: 1.5 },
        severity: 'medium',
        learningScore: 0.5,
        successRate: 0,
        totalDetections: 0,
        accurateFeedbacks: 0,
      },
      {
        id: 'income_drop',
        type: 'income_drop',
        name: 'Income Reduction',
        description: 'Income has decreased significantly',
        detectionPrompt: 'Detect if income has dropped by more than 20% compared to previous months',
        indicators: ['previous_income', 'current_income', 'drop_percentage'],
        thresholds: { drop_threshold: 0.8 },
        severity: 'high',
        learningScore: 0.5,
        successRate: 0,
        totalDetections: 0,
        accurateFeedbacks: 0,
      },
      {
        id: 'subscription_creep',
        type: 'subscription_creep',
        name: 'Subscription Accumulation',
        description: 'Growing number of recurring subscriptions',
        detectionPrompt: 'Detect if recurring subscription payments have increased by 3+ in the last 3 months',
        indicators: ['subscription_count', 'monthly_subscription_cost'],
        thresholds: { new_subscriptions: 3 },
        severity: 'low',
        learningScore: 0.5,
        successRate: 0,
        totalDetections: 0,
        accurateFeedbacks: 0,
      },
      {
        id: 'gambling_pattern',
        type: 'gambling',
        name: 'Gambling Activity',
        description: 'Transactions to gambling or betting platforms',
        detectionPrompt: 'Detect transactions to casinos, sports betting, or gambling platforms',
        indicators: ['gambling_transaction_count', 'total_gambling_amount'],
        thresholds: { gambling_transactions: 5 },
        severity: 'high',
        learningScore: 0.5,
        successRate: 0,
        totalDetections: 0,
        accurateFeedbacks: 0,
      },
      {
        id: 'debt_accumulation',
        type: 'debt_accumulation',
        name: 'Rising Debt Indicators',
        description: 'Increasing loan payments or credit card charges',
        detectionPrompt: 'Detect if loan payments or credit card spending is increasing month-over-month',
        indicators: ['debt_payment_trend', 'credit_utilization'],
        thresholds: { increase_months: 2 },
        severity: 'critical',
        learningScore: 0.5,
        successRate: 0,
        totalDetections: 0,
        accurateFeedbacks: 0,
      },
    ];
  }

  /**
   * Analyze transactions and detect risk patterns using LLM
   */
  async analyzeRisks(
    userId: string,
    transactions: Transaction[],
    historicalPatterns?: RiskPattern[]
  ): Promise<RiskPattern[]> {
    const detectedPatterns: RiskPattern[] = [];

    // Prepare transaction summary
    const summary = this.summarizeTransactions(transactions);

    // Get historical feedback to improve detection
    const feedbackContext = this.buildFeedbackContext(userId, historicalPatterns);

    // Use LLM to detect patterns
    const prompt = this.buildDetectionPrompt(summary, feedbackContext);

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a financial behavioral analyst. Detect risky spending patterns and behaviors.

Your job:
1. Analyze transaction data for risk patterns
2. Consider user's historical feedback (patterns they found useful vs not useful)
3. Adapt your detection based on what the user has validated before
4. Explain each pattern clearly and provide actionable recommendations

Known pattern types:
${this.patternTemplates.map(t => `- ${t.name}: ${t.description} (Success rate: ${(t.successRate * 100).toFixed(1)}%)`).join('\n')}

IMPORTANT:
- Prioritize patterns that have high success rates with this user
- Be conservative with patterns that have been rejected before
- Always provide confidence scores
- Include specific transaction examples`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        functions: [
          {
            name: 'detect_risk_patterns',
            description: 'Detect behavioral risk patterns in transaction data',
            parameters: {
              type: 'object',
              properties: {
                patterns: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: {
                        type: 'string',
                        enum: ['spending_spike', 'unusual_merchant', 'time_anomaly', 'category_shift', 'income_drop', 'debt_accumulation', 'subscription_creep', 'gambling', 'cash_withdrawal', 'foreign_transaction', 'late_payment', 'overdraft', 'custom'],
                      },
                      severity: {
                        type: 'string',
                        enum: ['low', 'medium', 'high', 'critical'],
                      },
                      title: { type: 'string' },
                      description: { type: 'string' },
                      confidence: { type: 'number', minimum: 0, maximum: 1 },
                      timeframe: { type: 'string' },
                      transactionIds: { type: 'array', items: { type: 'string' } },
                      indicators: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            value: { type: 'number' },
                            threshold: { type: 'number' },
                            comparison: { type: 'string', enum: ['above', 'below', 'unusual'] },
                          },
                        },
                      },
                      context: { type: 'string' },
                      recommendations: { type: 'array', items: { type: 'string' } },
                    },
                    required: ['type', 'severity', 'title', 'description', 'confidence', 'recommendations'],
                  },
                },
              },
              required: ['patterns'],
            },
          },
        ],
        function_call: { name: 'detect_risk_patterns' },
        temperature: 0.2,
      });

      const result = JSON.parse(response.choices[0]?.message?.function_call?.arguments || '{}');

      // Convert to RiskPattern objects
      result.patterns?.forEach((p: any, index: number) => {
        const pattern: RiskPattern = {
          id: `pattern_${Date.now()}_${index}`,
          userId,
          type: p.type,
          severity: p.severity,
          title: p.title,
          description: p.description,
          confidence: p.confidence,
          detectedAt: new Date().toISOString(),
          pattern: {
            timeframe: p.timeframe || 'recent',
            transactions: p.transactionIds || [],
            indicators: p.indicators || [],
            context: p.context,
          },
          recommendations: p.recommendations || [],
          version: 1,
          learningScore: this.getPatternTemplateScore(p.type),
        };

        detectedPatterns.push(pattern);
      });

      // Store patterns for this user
      const userPatterns = this.userPatterns.get(userId) || [];
      this.userPatterns.set(userId, [...userPatterns, ...detectedPatterns]);

      return detectedPatterns;
    } catch (error) {
      console.error('Risk analysis failed:', error);
      return [];
    }
  }

  /**
   * Record user feedback on a pattern
   */
  async recordFeedback(
    userId: string,
    patternId: string,
    feedback: {
      isAccurate: boolean;
      isRelevant: boolean;
      notes?: string;
    }
  ): Promise<void> {
    const userPatterns = this.userPatterns.get(userId) || [];
    const pattern = userPatterns.find(p => p.id === patternId);

    if (!pattern) {
      throw new Error('Pattern not found');
    }

    // Add feedback
    pattern.userFeedback = {
      ...feedback,
      submittedAt: new Date().toISOString(),
    };

    // Update learning scores
    const template = this.patternTemplates.find(t => t.type === pattern.type);
    if (template) {
      template.totalDetections++;
      if (feedback.isAccurate && feedback.isRelevant) {
        template.accurateFeedbacks++;
        template.learningScore = Math.min(1, template.learningScore + 0.1);
      } else {
        template.learningScore = Math.max(0, template.learningScore - 0.05);
      }
      template.successRate = template.accurateFeedbacks / template.totalDetections;
    }

    // If feedback is positive, increase pattern's learning score
    if (feedback.isAccurate && feedback.isRelevant) {
      pattern.learningScore = Math.min(1, pattern.learningScore + 0.1);
    }
  }

  /**
   * Evolve patterns based on feedback and new data
   */
  async evolvePatterns(userId: string): Promise<PatternTemplate[]> {
    const userPatterns = this.userPatterns.get(userId) || [];

    // Analyze which patterns worked well
    const successfulPatterns = userPatterns.filter(
      p => p.userFeedback?.isAccurate && p.userFeedback?.isRelevant
    );

    if (successfulPatterns.length === 0) {
      return this.patternTemplates;
    }

    // Use LLM to create new pattern templates based on successes
    const prompt = `Based on these successful risk patterns, suggest improvements or new pattern types to detect:

Successful Patterns:
${successfulPatterns.map(p => `- ${p.title}: ${p.description} (Confidence: ${p.confidence})`).join('\n')}

Current Templates:
${this.patternTemplates.map(t => `- ${t.name} (Success rate: ${(t.successRate * 100).toFixed(1)}%)`).join('\n')}

Suggest:
1. Improvements to existing patterns
2. New pattern types to detect
3. Better thresholds or indicators`;

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a machine learning system that evolves pattern detection based on user feedback.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
      });

      // TODO: Parse suggestions and update templates
      console.log('Pattern evolution suggestions:', response.choices[0]?.message?.content);

      return this.patternTemplates;
    } catch (error) {
      console.error('Pattern evolution failed:', error);
      return this.patternTemplates;
    }
  }

  /**
   * Get patterns for a user
   */
  getUserPatterns(userId: string, includeWithoutFeedback: boolean = true): RiskPattern[] {
    const patterns = this.userPatterns.get(userId) || [];

    if (includeWithoutFeedback) {
      return patterns;
    }

    return patterns.filter(p => p.userFeedback !== undefined);
  }

  /**
   * Get pattern templates (for analytics)
   */
  getPatternTemplates(): PatternTemplate[] {
    return this.patternTemplates;
  }

  // Private helper methods

  private summarizeTransactions(transactions: Transaction[]): string {
    const byCategory = new Map<string, { count: number; total: number }>();
    let totalSpent = 0;
    let totalIncome = 0;

    transactions.forEach(t => {
      if (t.payment_out > 0) {
        totalSpent += t.payment_out;
        const category = t.transaction_primary || 'UNCATEGORIZED';
        const current = byCategory.get(category) || { count: 0, total: 0 };
        byCategory.set(category, {
          count: current.count + 1,
          total: current.total + t.payment_out,
        });
      } else if (t.payment_in > 0) {
        totalIncome += t.payment_in;
      }
    });

    const categorySummary = Array.from(byCategory.entries())
      .map(([cat, data]) => `${cat}: ${data.count} txns, $${data.total.toFixed(2)}`)
      .join('\n');

    return `
Total Transactions: ${transactions.length}
Total Spent: $${totalSpent.toFixed(2)}
Total Income: $${totalIncome.toFixed(2)}
Date Range: ${transactions[0]?.date} to ${transactions[transactions.length - 1]?.date}

By Category:
${categorySummary}
`;
  }

  private buildFeedbackContext(userId: string, historicalPatterns?: RiskPattern[]): string {
    if (!historicalPatterns || historicalPatterns.length === 0) {
      return 'No historical feedback available for this user yet.';
    }

    const withFeedback = historicalPatterns.filter(p => p.userFeedback);
    const accurate = withFeedback.filter(p => p.userFeedback?.isAccurate);
    const inaccurate = withFeedback.filter(p => !p.userFeedback?.isAccurate);

    return `
Historical Feedback Summary:
- Total patterns shown: ${historicalPatterns.length}
- Patterns with feedback: ${withFeedback.length}
- Accurate detections: ${accurate.length}
- Inaccurate detections: ${inaccurate.length}

Patterns user found USEFUL:
${accurate.map(p => `- ${p.title} (${p.type})`).join('\n') || 'None yet'}

Patterns user found NOT USEFUL:
${inaccurate.map(p => `- ${p.title} (${p.type})`).join('\n') || 'None yet'}

User notes:
${withFeedback.filter(p => p.userFeedback?.notes).map(p => `- ${p.userFeedback?.notes}`).join('\n') || 'No notes'}
`;
  }

  private buildDetectionPrompt(summary: string, feedbackContext: string): string {
    return `Analyze these transactions for risky behavioral patterns:

${summary}

${feedbackContext}

Detect potential risk patterns and provide:
1. Pattern type and severity
2. Specific indicators (with numbers)
3. Context and explanation
4. Actionable recommendations

Focus on patterns that:
- The user has validated as useful in the past
- Show clear deviation from normal behavior
- Have high confidence based on data

Avoid patterns that:
- The user has marked as not useful
- Are too vague or speculative
- Lack supporting data`;
  }

  private getPatternTemplateScore(patternType: string): number {
    const template = this.patternTemplates.find(t => t.type === patternType);
    return template?.learningScore || 0.5;
  }
}

// Export singleton instance
export const riskAnalyzer = new BehaviorRiskAnalyzer();
