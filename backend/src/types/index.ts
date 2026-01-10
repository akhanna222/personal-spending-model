export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
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

  // Behavioral analysis fields
  behaviorRedFlags?: BehaviorRedFlag[];
  riskLevel?: 'HEALTHY' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  healthScore?: number;  // 0-100
  behaviorClassification?: 'GOOD' | 'NEUTRAL' | 'CONCERNING' | 'PROBLEMATIC';
  interventionNeeded?: boolean;
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

export interface BehaviorRedFlag {
  flagType: string;  // e.g., "GAMBLING_FREQUENT", "LATE_NIGHT_IMPULSE", "LUXURY_BEYOND_MEANS"
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  recommendation: string;
  potentialSavings?: number;
  alternative?: string;
  resourcesAvailable?: string;
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

  // Behavioral analysis
  behaviorRedFlags?: BehaviorRedFlag[];
  riskLevel?: 'HEALTHY' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  healthScore?: number;  // 0-100
  behaviorClassification?: 'GOOD' | 'NEUTRAL' | 'CONCERNING' | 'PROBLEMATIC';
  interventionNeeded?: boolean;
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
