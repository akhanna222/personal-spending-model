export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  transaction_text: string; // Raw transaction text from bank statement
  payment_in: number; // Amount received (0 if not applicable)
  payment_out: number; // Amount paid (0 if not applicable)
  balance?: number; // Account balance after transaction
  transaction_description?: string; // AI-generated description
  transaction_primary?: string; // Plaid primary category
  transaction_detailed?: string; // Plaid detailed category

  // Legacy fields for backward compatibility
  amount?: number;
  currency?: string;
  rawDescription?: string;
  enhancedDescription?: string;
  primaryCategory?: string;
  detailedCategory?: string;
  categoryConfidence?: number;
  isIncome?: boolean;
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

export interface UploadedStatement {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'csv';
  uploadDate: string;
  pageCount?: number;
  transactionCount: number;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface TransactionEnhancement {
  enhancedDescription: string;
  merchant?: string;
  channel: 'online' | 'in-store' | 'subscription' | 'unknown';
  purpose?: string;
  primaryCategory: string;
  detailedCategory: string;
  confidence: number;
  reasoning?: string;
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

export interface ParsedStatement {
  transactions: Transaction[];
  metadata: {
    fileName: string;
    pageCount?: number;
    dateRange?: {
      start: string;
      end: string;
    };
  };
}
