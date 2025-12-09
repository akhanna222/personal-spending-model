import { Transaction, BehavioralInsights } from '../types';

/**
 * Generate behavioral spending insights from transactions
 */
export function generateInsights(transactions: Transaction[]): BehavioralInsights {
  // Filter out transactions without categories
  const categorizedTransactions = transactions.filter(
    t => t.primaryCategory && t.detailedCategory
  );

  // Determine date range
  const dates = transactions.map(t => t.date).sort();
  const period = {
    start: dates[0] || new Date().toISOString().split('T')[0],
    end: dates[dates.length - 1] || new Date().toISOString().split('T')[0],
  };

  // Calculate basic summary metrics
  const incomeTransactions = categorizedTransactions.filter(t => t.isIncome);
  const expenseTransactions = categorizedTransactions.filter(t => !t.isIncome);

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalSpend = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpend) / totalIncome) * 100 : 0;

  // Calculate monthly averages
  const monthsInPeriod = calculateMonthsBetween(period.start, period.end);
  const avgMonthlyIncome = monthsInPeriod > 0 ? totalIncome / monthsInPeriod : totalIncome;
  const avgMonthlySpend = monthsInPeriod > 0 ? totalSpend / monthsInPeriod : totalSpend;

  // Detect recurring payments
  const recurringPayments = detectRecurringPayments(expenseTransactions);
  const recurringPaymentsCount = recurringPayments.length;

  // Generate category breakdown
  const categoryBreakdown = generateCategoryBreakdown(expenseTransactions, totalSpend);

  // Generate monthly trends
  const monthlyTrends = generateMonthlyTrends(categorizedTransactions);

  // Analyze spending patterns
  const spendingPatterns = analyzeSpendingPatterns(expenseTransactions);

  // Generate forecast
  const forecast = generateForecast(monthlyTrends, categoryBreakdown);

  // Generate insight text
  const insights = generateInsightTexts(
    categoryBreakdown,
    recurringPayments,
    spendingPatterns,
    monthlyTrends
  );

  return {
    period,
    summary: {
      totalIncome,
      totalSpend,
      savingsRate,
      recurringPaymentsCount,
      avgMonthlyIncome,
      avgMonthlySpend,
    },
    categoryBreakdown,
    monthlyTrends,
    recurringPayments,
    spending_patterns: spendingPatterns,
    forecast,
    insights,
  };
}

/**
 * Generate category-level breakdown
 */
function generateCategoryBreakdown(transactions: Transaction[], totalSpend: number) {
  const categoryMap = new Map<string, {
    total: number;
    detailed: Map<string, { amount: number; count: number }>;
  }>();

  // Aggregate by primary category
  transactions.forEach(t => {
    if (!t.primaryCategory || !t.detailedCategory) return;

    if (!categoryMap.has(t.primaryCategory)) {
      categoryMap.set(t.primaryCategory, {
        total: 0,
        detailed: new Map(),
      });
    }

    const category = categoryMap.get(t.primaryCategory)!;
    category.total += Math.abs(t.amount);

    if (!category.detailed.has(t.detailedCategory)) {
      category.detailed.set(t.detailedCategory, { amount: 0, count: 0 });
    }

    const detailed = category.detailed.get(t.detailedCategory)!;
    detailed.amount += Math.abs(t.amount);
    detailed.count += 1;
  });

  // Convert to array format
  return Array.from(categoryMap.entries())
    .map(([primaryCategory, data]) => ({
      primaryCategory,
      totalAmount: data.total,
      percentage: totalSpend > 0 ? (data.total / totalSpend) * 100 : 0,
      detailedBreakdown: Array.from(data.detailed.entries())
        .map(([detailedCategory, stats]) => ({
          detailedCategory,
          amount: stats.amount,
          transactionCount: stats.count,
        }))
        .sort((a, b) => b.amount - a.amount),
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Generate monthly trend data
 */
function generateMonthlyTrends(transactions: Transaction[]) {
  const monthlyMap = new Map<string, { income: number; spend: number }>();

  transactions.forEach(t => {
    const month = t.date.substring(0, 7); // YYYY-MM
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { income: 0, spend: 0 });
    }

    const data = monthlyMap.get(month)!;
    if (t.isIncome) {
      data.income += Math.abs(t.amount);
    } else {
      data.spend += Math.abs(t.amount);
    }
  });

  return Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      income: data.income,
      spend: data.spend,
      net: data.income - data.spend,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Detect recurring payments
 */
function detectRecurringPayments(transactions: Transaction[]) {
  const merchantMap = new Map<string, Transaction[]>();

  // Group by merchant
  transactions.forEach(t => {
    const merchant = t.merchant || t.rawDescription.substring(0, 30);
    if (!merchantMap.has(merchant)) {
      merchantMap.set(merchant, []);
    }
    merchantMap.get(merchant)!.push(t);
  });

  const recurring: Array<{
    merchant: string;
    amount: number;
    frequency: string;
    category: string;
  }> = [];

  // Find merchants with regular payments
  merchantMap.forEach((txns, merchant) => {
    if (txns.length < 3) return; // Need at least 3 occurrences

    // Check if amounts are similar (within 10%)
    const amounts = txns.map(t => Math.abs(t.amount));
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.every(amt => Math.abs(amt - avgAmount) / avgAmount < 0.1);

    if (variance) {
      // Check if dates are roughly periodic
      const sortedDates = txns.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());
      const intervals: number[] = [];
      for (let i = 1; i < sortedDates.length; i++) {
        const days = (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
        intervals.push(days);
      }

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      let frequency = 'irregular';
      if (avgInterval >= 25 && avgInterval <= 35) frequency = 'monthly';
      else if (avgInterval >= 360 && avgInterval <= 370) frequency = 'yearly';
      else if (avgInterval >= 5 && avgInterval <= 9) frequency = 'weekly';

      if (frequency !== 'irregular') {
        recurring.push({
          merchant: merchant.substring(0, 50),
          amount: avgAmount,
          frequency,
          category: txns[0].primaryCategory || 'UNCATEGORIZED',
        });
      }
    }
  });

  return recurring.sort((a, b) => b.amount - a.amount);
}

/**
 * Analyze spending patterns (fixed vs variable vs discretionary)
 */
function analyzeSpendingPatterns(transactions: Transaction[]) {
  const fixedCategories = ['RENT_AND_UTILITIES', 'LOAN_PAYMENTS', 'INSURANCE'];
  const discretionaryCategories = ['ENTERTAINMENT', 'SHOPPING', 'TRAVEL', 'DINING'];

  let fixed = 0;
  let discretionary = 0;
  let variable = 0;

  transactions.forEach(t => {
    const amount = Math.abs(t.amount);
    if (fixedCategories.includes(t.primaryCategory || '')) {
      fixed += amount;
    } else if (discretionaryCategories.includes(t.primaryCategory || '')) {
      discretionary += amount;
    } else {
      variable += amount;
    }
  });

  return { fixed, variable, discretionary };
}

/**
 * Generate simple forecast for next 3 months
 */
function generateForecast(monthlyTrends: any[], categoryBreakdown: any[]) {
  if (monthlyTrends.length < 3) {
    return undefined; // Not enough data for forecast
  }

  // Simple moving average for forecast
  const recentMonths = monthlyTrends.slice(-3);
  const avgSpend = recentMonths.reduce((sum, m) => sum + m.spend, 0) / recentMonths.length;

  const lastMonth = new Date(monthlyTrends[monthlyTrends.length - 1].month + '-01');
  const forecast = [];

  for (let i = 1; i <= 3; i++) {
    const nextMonth = new Date(lastMonth);
    nextMonth.setMonth(nextMonth.getMonth() + i);
    const monthStr = nextMonth.toISOString().substring(0, 7);

    forecast.push({
      month: monthStr,
      expectedSpend: avgSpend,
      confidence: i === 1 ? 'high' : i === 2 ? 'medium' : 'low',
    });
  }

  return { nextThreeMonths: forecast };
}

/**
 * Generate human-readable insights
 */
function generateInsightTexts(
  categoryBreakdown: any[],
  recurringPayments: any[],
  spendingPatterns: any,
  monthlyTrends: any[]
): string[] {
  const insights: string[] = [];

  // Top spending category
  if (categoryBreakdown.length > 0) {
    const topCategory = categoryBreakdown[0];
    insights.push(
      `Your largest spend is ${topCategory.primaryCategory}, accounting for ${topCategory.percentage.toFixed(1)}% of your total outgoings.`
    );

    // Top detailed category
    if (topCategory.detailedBreakdown.length > 0) {
      const topDetailed = topCategory.detailedBreakdown[0];
      insights.push(
        `Within ${topCategory.primaryCategory}, you spend the most on ${topDetailed.detailedCategory} (${topDetailed.amount.toFixed(2)}).`
      );
    }
  }

  // Recurring subscriptions
  const subscriptions = recurringPayments.filter(r => r.frequency === 'monthly');
  if (subscriptions.length > 0) {
    const totalSubscriptions = subscriptions.reduce((sum, s) => sum + s.amount, 0);
    insights.push(
      `You have ${subscriptions.length} recurring monthly payments totaling ${totalSubscriptions.toFixed(2)}.`
    );
  }

  // Spending pattern analysis
  const total = spendingPatterns.fixed + spendingPatterns.variable + spendingPatterns.discretionary;
  if (total > 0) {
    const fixedPct = (spendingPatterns.fixed / total) * 100;
    insights.push(
      `${fixedPct.toFixed(1)}% of your spending is on fixed costs (rent, utilities, loans).`
    );
  }

  // Trend analysis
  if (monthlyTrends.length >= 3) {
    const recent = monthlyTrends.slice(-3);
    const older = monthlyTrends.slice(-6, -3);
    if (older.length > 0) {
      const recentAvg = recent.reduce((sum, m) => sum + m.spend, 0) / recent.length;
      const olderAvg = older.reduce((sum, m) => sum + m.spend, 0) / older.length;
      const change = ((recentAvg - olderAvg) / olderAvg) * 100;

      if (Math.abs(change) > 5) {
        insights.push(
          `Your spending has ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% over the last 3 months.`
        );
      }
    }
  }

  return insights;
}

/**
 * Calculate number of months between two dates
 */
function calculateMonthsBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth()) + 1;
  return Math.max(1, months);
}
