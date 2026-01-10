import OpenAI from 'openai';
import { Transaction, TransactionEnhancement } from '../types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const OPENAI_MODEL = 'gpt-4o-mini';

/**
 * Plaid Category Taxonomy
 * Based on: https://plaid.com/documents/transactions-personal-finance-category-taxonomy.csv
 */
export interface PlaidCategory {
  primary: string;
  detailed: string;
  categoryId?: string;
  description?: string;
}

/**
 * Plaid's Primary Categories
 */
export const PLAID_PRIMARY_CATEGORIES = [
  'INCOME',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'LOAN_PAYMENTS',
  'BANK_FEES',
  'ENTERTAINMENT',
  'FOOD_AND_DRINK',
  'GENERAL_MERCHANDISE',
  'HOME_IMPROVEMENT',
  'MEDICAL',
  'PERSONAL_CARE',
  'GENERAL_SERVICES',
  'GOVERNMENT_AND_NON_PROFIT',
  'TRANSPORTATION',
  'TRAVEL',
  'RENT_AND_UTILITIES',
];

/**
 * Plaid Category Taxonomy (Hierarchical)
 * Format: [PRIMARY, DETAILED]
 */
export const PLAID_CATEGORIES: PlaidCategory[] = [
  // INCOME
  { primary: 'INCOME', detailed: 'INCOME_DIVIDENDS' },
  { primary: 'INCOME', detailed: 'INCOME_INTEREST_EARNED' },
  { primary: 'INCOME', detailed: 'INCOME_RETIREMENT_PENSION' },
  { primary: 'INCOME', detailed: 'INCOME_TAX_REFUND' },
  { primary: 'INCOME', detailed: 'INCOME_UNEMPLOYMENT' },
  { primary: 'INCOME', detailed: 'INCOME_WAGES' },
  { primary: 'INCOME', detailed: 'INCOME_OTHER_INCOME' },

  // TRANSFER
  { primary: 'TRANSFER_IN', detailed: 'TRANSFER_IN_CASH_DEPOSITS_AND_TRANSFERS' },
  { primary: 'TRANSFER_IN', detailed: 'TRANSFER_IN_DEPOSIT' },
  { primary: 'TRANSFER_IN', detailed: 'TRANSFER_IN_INVESTMENT_AND_RETIREMENT_FUNDS' },
  { primary: 'TRANSFER_IN', detailed: 'TRANSFER_IN_SAVINGS' },
  { primary: 'TRANSFER_IN', detailed: 'TRANSFER_IN_ACCOUNT_TRANSFER' },
  { primary: 'TRANSFER_IN', detailed: 'TRANSFER_IN_OTHER_TRANSFER_IN' },

  { primary: 'TRANSFER_OUT', detailed: 'TRANSFER_OUT_INVESTMENT_AND_RETIREMENT_FUNDS' },
  { primary: 'TRANSFER_OUT', detailed: 'TRANSFER_OUT_SAVINGS' },
  { primary: 'TRANSFER_OUT', detailed: 'TRANSFER_OUT_WITHDRAWAL' },
  { primary: 'TRANSFER_OUT', detailed: 'TRANSFER_OUT_ACCOUNT_TRANSFER' },
  { primary: 'TRANSFER_OUT', detailed: 'TRANSFER_OUT_OTHER_TRANSFER_OUT' },

  // LOAN_PAYMENTS
  { primary: 'LOAN_PAYMENTS', detailed: 'LOAN_PAYMENTS_CAR_PAYMENT' },
  { primary: 'LOAN_PAYMENTS', detailed: 'LOAN_PAYMENTS_CREDIT_CARD_PAYMENT' },
  { primary: 'LOAN_PAYMENTS', detailed: 'LOAN_PAYMENTS_PERSONAL_LOAN_PAYMENT' },
  { primary: 'LOAN_PAYMENTS', detailed: 'LOAN_PAYMENTS_MORTGAGE_PAYMENT' },
  { primary: 'LOAN_PAYMENTS', detailed: 'LOAN_PAYMENTS_STUDENT_LOAN_PAYMENT' },
  { primary: 'LOAN_PAYMENTS', detailed: 'LOAN_PAYMENTS_OTHER_PAYMENT' },

  // BANK_FEES
  { primary: 'BANK_FEES', detailed: 'BANK_FEES_ATM_FEES' },
  { primary: 'BANK_FEES', detailed: 'BANK_FEES_FOREIGN_TRANSACTION_FEES' },
  { primary: 'BANK_FEES', detailed: 'BANK_FEES_INSUFFICIENT_FUNDS' },
  { primary: 'BANK_FEES', detailed: 'BANK_FEES_INTEREST_CHARGE' },
  { primary: 'BANK_FEES', detailed: 'BANK_FEES_OVERDRAFT_FEES' },
  { primary: 'BANK_FEES', detailed: 'BANK_FEES_OTHER_BANK_FEES' },

  // ENTERTAINMENT
  { primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_CASINOS_AND_GAMBLING' },
  { primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_MUSIC_AND_AUDIO' },
  { primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_SPORTING_EVENTS_AMUSEMENT_PARKS_AND_MUSEUMS' },
  { primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_TV_AND_MOVIES' },
  { primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_VIDEO_GAMES' },
  { primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_OTHER_ENTERTAINMENT' },

  // FOOD_AND_DRINK
  { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_BEER_WINE_AND_LIQUOR' },
  { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_COFFEE' },
  { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_FAST_FOOD' },
  { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' },
  { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_RESTAURANT' },
  { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_VENDING_MACHINES' },
  { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_OTHER_FOOD_AND_DRINK' },

  // GENERAL_MERCHANDISE
  { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_BOOKSTORES_AND_NEWSSTANDS' },
  { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES' },
  { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_CONVENIENCE_STORES' },
  { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_DEPARTMENT_STORES' },
  { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_DISCOUNT_STORES' },
  { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_ELECTRONICS' },
  { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_GIFTS_AND_NOVELTIES' },
  { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_OFFICE_SUPPLIES' },
  { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES' },
  { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_PET_SUPPLIES' },
  { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_SPORTING_GOODS' },
  { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_SUPERSTORES' },
  { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_TOBACCO_AND_VAPE' },
  { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_OTHER_GENERAL_MERCHANDISE' },

  // HOME_IMPROVEMENT
  { primary: 'HOME_IMPROVEMENT', detailed: 'HOME_IMPROVEMENT_FURNITURE' },
  { primary: 'HOME_IMPROVEMENT', detailed: 'HOME_IMPROVEMENT_HARDWARE' },
  { primary: 'HOME_IMPROVEMENT', detailed: 'HOME_IMPROVEMENT_REPAIR_AND_MAINTENANCE' },
  { primary: 'HOME_IMPROVEMENT', detailed: 'HOME_IMPROVEMENT_SECURITY' },
  { primary: 'HOME_IMPROVEMENT', detailed: 'HOME_IMPROVEMENT_OTHER_HOME_IMPROVEMENT' },

  // MEDICAL
  { primary: 'MEDICAL', detailed: 'MEDICAL_DENTAL_CARE' },
  { primary: 'MEDICAL', detailed: 'MEDICAL_EYE_CARE' },
  { primary: 'MEDICAL', detailed: 'MEDICAL_NURSING_CARE' },
  { primary: 'MEDICAL', detailed: 'MEDICAL_PHARMACIES_AND_SUPPLEMENTS' },
  { primary: 'MEDICAL', detailed: 'MEDICAL_PRIMARY_CARE' },
  { primary: 'MEDICAL', detailed: 'MEDICAL_VETERINARY_SERVICES' },
  { primary: 'MEDICAL', detailed: 'MEDICAL_OTHER_MEDICAL' },

  // PERSONAL_CARE
  { primary: 'PERSONAL_CARE', detailed: 'PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS' },
  { primary: 'PERSONAL_CARE', detailed: 'PERSONAL_CARE_HAIR_AND_BEAUTY' },
  { primary: 'PERSONAL_CARE', detailed: 'PERSONAL_CARE_LAUNDRY_AND_DRY_CLEANING' },
  { primary: 'PERSONAL_CARE', detailed: 'PERSONAL_CARE_OTHER_PERSONAL_CARE' },

  // GENERAL_SERVICES
  { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_ACCOUNTING_AND_FINANCIAL_PLANNING' },
  { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_AUTOMOTIVE' },
  { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_CHILDCARE' },
  { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_CONSULTING_AND_LEGAL' },
  { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_EDUCATION' },
  { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_INSURANCE' },
  { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_POSTAGE_AND_SHIPPING' },
  { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_STORAGE' },
  { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_OTHER_GENERAL_SERVICES' },

  // GOVERNMENT_AND_NON_PROFIT
  { primary: 'GOVERNMENT_AND_NON_PROFIT', detailed: 'GOVERNMENT_AND_NON_PROFIT_DONATIONS' },
  { primary: 'GOVERNMENT_AND_NON_PROFIT', detailed: 'GOVERNMENT_AND_NON_PROFIT_GOVERNMENT_DEPARTMENTS_AND_AGENCIES' },
  { primary: 'GOVERNMENT_AND_NON_PROFIT', detailed: 'GOVERNMENT_AND_NON_PROFIT_TAX_PAYMENT' },
  { primary: 'GOVERNMENT_AND_NON_PROFIT', detailed: 'GOVERNMENT_AND_NON_PROFIT_OTHER_GOVERNMENT_AND_NON_PROFIT' },

  // TRANSPORTATION
  { primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_BIKES_AND_SCOOTERS' },
  { primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_GAS' },
  { primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_PARKING' },
  { primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_PUBLIC_TRANSIT' },
  { primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_TAXIS_AND_RIDE_SHARES' },
  { primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_TOLLS' },
  { primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_OTHER_TRANSPORTATION' },

  // TRAVEL
  { primary: 'TRAVEL', detailed: 'TRAVEL_FLIGHTS' },
  { primary: 'TRAVEL', detailed: 'TRAVEL_LODGING' },
  { primary: 'TRAVEL', detailed: 'TRAVEL_RENTAL_CARS' },
  { primary: 'TRAVEL', detailed: 'TRAVEL_OTHER_TRAVEL' },

  // RENT_AND_UTILITIES
  { primary: 'RENT_AND_UTILITIES', detailed: 'RENT_AND_UTILITIES_GAS_AND_ELECTRICITY' },
  { primary: 'RENT_AND_UTILITIES', detailed: 'RENT_AND_UTILITIES_INTERNET_AND_CABLE' },
  { primary: 'RENT_AND_UTILITIES', detailed: 'RENT_AND_UTILITIES_RENT' },
  { primary: 'RENT_AND_UTILITIES', detailed: 'RENT_AND_UTILITIES_SEWAGE_AND_WASTE_MANAGEMENT' },
  { primary: 'RENT_AND_UTILITIES', detailed: 'RENT_AND_UTILITIES_TELEPHONE' },
  { primary: 'RENT_AND_UTILITIES', detailed: 'RENT_AND_UTILITIES_WATER' },
  { primary: 'RENT_AND_UTILITIES', detailed: 'RENT_AND_UTILITIES_OTHER_UTILITIES' },
];

/**
 * Classify transaction into Plaid category using LLM
 */
export async function classifyToPlaidCategory(
  transaction: Transaction
): Promise<{
  primaryCategory: string;
  detailedCategory: string;
  confidence: number;
  reasoning: string;
}> {
  const categoryList = PLAID_CATEGORIES.map(
    (c) => `${c.primary} -> ${c.detailed}`
  ).join('\n');

  const systemPrompt = `You are a Plaid-compatible transaction categorizer.
Classify transactions using the official Plaid Personal Finance Category taxonomy.

Return ONLY valid JSON.`;

  const userPrompt = `
Categorize this transaction using Plaid categories:

Date: ${transaction.date}
Amount: ${transaction.currency} ${Math.abs(transaction.amount).toFixed(2)}
Type: ${transaction.isIncome ? 'INCOME' : 'EXPENSE'}
Description: ${transaction.rawDescription}

Available Plaid Categories:
${categoryList}

Return JSON:
{
  "primaryCategory": "PRIMARY_CATEGORY",
  "detailedCategory": "DETAILED_CATEGORY",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}

Rules:
- primaryCategory must match a Plaid PRIMARY category exactly
- detailedCategory must match the corresponding DETAILED category
- confidence: 0.0 (uncertain) to 1.0 (certain)
`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.0,
      max_tokens: 300,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(content);
    return {
      primaryCategory: result.primaryCategory || 'GENERAL_MERCHANDISE',
      detailedCategory: result.detailedCategory || 'GENERAL_MERCHANDISE_OTHER_GENERAL_MERCHANDISE',
      confidence: result.confidence || 0.5,
      reasoning: result.reasoning || 'Classification completed',
    };
  } catch (error: any) {
    console.error('Plaid classification error:', error);
    // Fallback classification
    return {
      primaryCategory: transaction.isIncome ? 'INCOME' : 'GENERAL_MERCHANDISE',
      detailedCategory: transaction.isIncome
        ? 'INCOME_OTHER_INCOME'
        : 'GENERAL_MERCHANDISE_OTHER_GENERAL_MERCHANDISE',
      confidence: 0.1,
      reasoning: 'Classification failed, using fallback',
    };
  }
}

/**
 * Batch classify transactions to Plaid categories
 */
export async function classifyBatchToPlaid(
  transactions: Transaction[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, PlaidCategory & { confidence: number; reasoning: string }>> {
  const results = new Map();
  const batchSize = 5;

  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);

    const promises = batch.map(async (txn) => {
      const classification = await classifyToPlaidCategory(txn);
      results.set(txn.id, classification);

      if (onProgress) {
        onProgress(i + batch.indexOf(txn) + 1, transactions.length);
      }
    });

    await Promise.all(promises);

    // Rate limiting
    if (i + batchSize < transactions.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Validate Plaid category combination
 */
export function isValidPlaidCategory(primary: string, detailed: string): boolean {
  return PLAID_CATEGORIES.some(
    (c) => c.primary === primary && c.detailed === detailed
  );
}

/**
 * Get all detailed categories for a primary category
 */
export function getPlaidDetailedCategories(primary: string): string[] {
  return PLAID_CATEGORIES.filter((c) => c.primary === primary).map((c) => c.detailed);
}

/**
 * Get Plaid category by detailed category name
 */
export function getPlaidCategory(detailedCategory: string): PlaidCategory | undefined {
  return PLAID_CATEGORIES.find((c) => c.detailed === detailedCategory);
}
