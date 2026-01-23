/**
 * Transaction Helper Utilities
 * Common functions for transaction processing
 */

import { Transaction } from '../types';

/**
 * Safely get transaction amount
 */
export function getTransactionAmount(transaction: Transaction): number {
  return Math.abs(transaction.amount || 0);
}

/**
 * Safely get transaction description
 */
export function getTransactionDescription(transaction: Transaction): string {
  return transaction.rawDescription || transaction.transaction_text || '';
}

/**
 * Calculate total amount from transactions
 */
export function calculateTotalAmount(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + getTransactionAmount(t), 0);
}

/**
 * Filter transactions by date range
 */
export function filterByDateRange(
  transactions: Transaction[],
  startDate?: string,
  endDate?: string
): Transaction[] {
  let filtered = [...transactions];

  if (startDate) {
    filtered = filtered.filter(t => t.date >= startDate);
  }

  if (endDate) {
    filtered = filtered.filter(t => t.date <= endDate);
  }

  return filtered;
}

/**
 * Filter transactions by category
 */
export function filterByCategory(
  transactions: Transaction[],
  primaryCategory?: string,
  detailedCategory?: string
): Transaction[] {
  let filtered = [...transactions];

  if (primaryCategory) {
    filtered = filtered.filter(
      t => t.primaryCategory === primaryCategory || t.transaction_primary === primaryCategory
    );
  }

  if (detailedCategory) {
    filtered = filtered.filter(
      t => t.detailedCategory === detailedCategory || t.transaction_detailed === detailedCategory
    );
  }

  return filtered;
}

/**
 * Search transactions by text
 */
export function searchTransactions(transactions: Transaction[], searchText: string): Transaction[] {
  const search = searchText.toLowerCase();
  return transactions.filter(t => {
    const description = getTransactionDescription(t).toLowerCase();
    const enhancedDesc = (t.enhancedDescription || t.transaction_description || '').toLowerCase();
    const merchant = (t.merchant || '').toLowerCase();

    return description.includes(search) || enhancedDesc.includes(search) || merchant.includes(search);
  });
}

/**
 * Group transactions by merchant
 */
export function groupByMerchant(transactions: Transaction[]): Map<string, Transaction[]> {
  const merchantMap = new Map<string, Transaction[]>();

  transactions.forEach(t => {
    const merchant = t.merchant || getTransactionDescription(t).substring(0, 30);
    if (!merchantMap.has(merchant)) {
      merchantMap.set(merchant, []);
    }
    merchantMap.get(merchant)!.push(t);
  });

  return merchantMap;
}

/**
 * Get month key from date (YYYY-MM format)
 */
export function getMonthKey(date: string): string {
  return date.substring(0, 7);
}

/**
 * Calculate variance of amounts
 */
export function calculateVariance(amounts: number[]): boolean {
  if (amounts.length === 0) return false;
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  return amounts.every(amt => Math.abs(amt - avg) / avg < 0.1);
}

/**
 * Calculate days between dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
