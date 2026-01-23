/**
 * Route Helper Utilities
 * Common functions for route handlers
 */

import { Request } from 'express';
import { Transaction } from '../types';
import { filterByDateRange, filterByCategory, searchTransactions } from './transactionHelpers';

/**
 * Apply all filters to transactions based on query parameters
 */
export function applyTransactionFilters(
  transactions: Transaction[],
  query: Request['query']
): Transaction[] {
  let filtered = [...transactions];

  // Date range filter
  filtered = filterByDateRange(
    filtered,
    query.startDate as string | undefined,
    query.endDate as string | undefined
  );

  // Category filters
  filtered = filterByCategory(
    filtered,
    query.primaryCategory as string | undefined,
    query.detailedCategory as string | undefined
  );

  // Confidence filter
  if (query.minConfidence) {
    const minConf = parseFloat(query.minConfidence as string);
    filtered = filtered.filter(t => (t.categoryConfidence || 0) >= minConf);
  }

  // Search filter
  if (query.search) {
    filtered = searchTransactions(filtered, query.search as string);
  }

  return filtered;
}

/**
 * Paginate results
 */
export function paginate<T>(
  items: T[],
  page: number = 1,
  limit: number = 100
): { data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } } {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const data = items.slice(startIndex, endIndex);

  return {
    data,
    pagination: {
      page,
      limit,
      total: items.length,
      totalPages: Math.ceil(items.length / limit),
    },
  };
}

/**
 * Parse pagination parameters from query
 */
export function getPaginationParams(query: Request['query']): { page: number; limit: number } {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(1000, Math.max(1, parseInt(query.limit as string) || 100));
  return { page, limit };
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: any,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing = requiredFields.filter(field => !body[field]);
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Safe string conversion
 */
export function toString(value: any): string {
  return value?.toString() || '';
}
