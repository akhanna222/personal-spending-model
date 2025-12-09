export interface Transaction {
  id: string;
  date: string;
  amount: number;
  currency: string;
  rawDescription: string;
  enhancedDescription?: string;
  primaryCategory?: string;
  detailedCategory?: string;
  categoryConfidence?: number;
  isIncome: boolean;
  isRecurring?: boolean;
  merchant?: string;
  channel?: 'online' | 'in-store' | 'subscription' | 'unknown';
  flags?: string[];
}

export interface Category {
  PRIMARY: string;
  DETAILED: string;
  DESCRIPTION: string;
}

export interface BehavioralInsights {
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalIncome: number;
    totalSpend: number;
    savingsRate: number;
    recurringPaymentsCount: number;
    avgMonthlyIncome: number;
    avgMonthlySpend: number;
  };
  categoryBreakdown: Array<{
    primaryCategory: string;
    totalAmount: number;
    percentage: number;
    detailedBreakdown: Array<{
      detailedCategory: string;
      amount: number;
      transactionCount: number;
    }>;
  }>;
  monthlyTrends: Array<{
    month: string;
    income: number;
    spend: number;
    net: number;
  }>;
  recurringPayments: Array<{
    merchant: string;
    amount: number;
    frequency: string;
    category: string;
  }>;
  spending_patterns: {
    fixed: number;
    variable: number;
    discretionary: number;
  };
  forecast?: {
    nextThreeMonths: Array<{
      month: string;
      expectedSpend: number;
      confidence: string;
    }>;
  };
  insights: string[];
}
