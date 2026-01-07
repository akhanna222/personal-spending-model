import OpenAI from 'openai';
import { Transaction } from '../types';
import plaidCategories from '../../../shared/plaid-categories.json';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PlaidCategory {
  PRIMARY: string;
  DETAILED: string;
  DESCRIPTION: string;
}

interface TransactionDescriptionResult {
  transaction_description: string;
}

interface CategoryMatchResult {
  transaction_primary: string;
  transaction_detailed: string;
  matched: boolean;
}

/**
 * Generate a human-readable description for a transaction using OpenAI
 */
export async function generateTransactionDescription(
  transactionText: string
): Promise<string> {
  try {
    const prompt = `You are a financial transaction analyzer. Given the following bank transaction text, provide a clear, concise, human-readable description of what this transaction is for.

Transaction text: "${transactionText}"

Provide only the description, nothing else. Be concise and clear. Focus on what was purchased or the service received.`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful financial assistant that describes bank transactions clearly and concisely.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    const description = completion.choices[0]?.message?.content?.trim() || transactionText;
    return description;
  } catch (error) {
    console.error('Error generating transaction description:', error);
    return transactionText; // Fallback to original text
  }
}

/**
 * Match a transaction to Plaid categories using OpenAI
 * Matches based on transaction text, description, and payment direction
 */
export async function matchPlaidCategory(
  transaction_text: string,
  transaction_description: string,
  payment_in: number,
  payment_out: number
): Promise<CategoryMatchResult> {
  try {
    // Format payment info for matching
    let paymentInfo = '';
    if (payment_in > 0) {
      paymentInfo = `payment_in ${payment_in.toFixed(2)}`;
    } else if (payment_out > 0) {
      paymentInfo = `payment_out ${payment_out.toFixed(2)}`;
    }

    const categories = plaidCategories['Plaid Categories'] as PlaidCategory[];
    const categoryList = categories
      .map((c) => `${c.PRIMARY} | ${c.DETAILED} | ${c.DESCRIPTION}`)
      .join('\n');

    const prompt = `You are a financial transaction categorizer. Match the following transaction to the most appropriate Plaid category.

Transaction Information:
- Transaction text: "${transaction_text}"
- Description: "${transaction_description}"
- Payment: ${paymentInfo}

Available Plaid Categories (PRIMARY | DETAILED | DESCRIPTION):
${categoryList}

IMPORTANT RULES:
1. You MUST match to one of the categories from the list above
2. Consider the transaction text, description, and payment direction
3. If payment_in > 0, prioritize INCOME or TRANSFER_IN categories
4. If payment_out > 0, prioritize expense categories or TRANSFER_OUT
5. Match as specifically as possible
6. Only respond with JSON in this exact format:
{
  "PRIMARY": "PRIMARY_CATEGORY",
  "DETAILED": "DETAILED_CATEGORY"
}

If you cannot find a good match, leave both fields empty strings.`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a precise financial categorization assistant. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 150,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '{}';
    const result = JSON.parse(responseText);

    // Validate the match
    const isValidMatch = categories.some(
      (c) => c.PRIMARY === result.PRIMARY && c.DETAILED === result.DETAILED
    );

    if (isValidMatch) {
      return {
        transaction_primary: result.PRIMARY,
        transaction_detailed: result.DETAILED,
        matched: true,
      };
    } else {
      // No match found
      return {
        transaction_primary: '',
        transaction_detailed: '',
        matched: false,
      };
    }
  } catch (error) {
    console.error('Error matching Plaid category:', error);
    return {
      transaction_primary: '',
      transaction_detailed: '',
      matched: false,
    };
  }
}

/**
 * Enhance a single transaction with OpenAI-generated description and Plaid category
 */
export async function enhanceTransactionWithOpenAI(
  transaction: Transaction
): Promise<Transaction> {
  try {
    // Generate description
    const description = await generateTransactionDescription(transaction.transaction_text);

    // Match to Plaid category
    const categoryMatch = await matchPlaidCategory(
      transaction.transaction_text,
      description,
      transaction.payment_in,
      transaction.payment_out
    );

    return {
      ...transaction,
      transaction_description: description,
      transaction_primary: categoryMatch.transaction_primary || undefined,
      transaction_detailed: categoryMatch.transaction_detailed || undefined,
    };
  } catch (error) {
    console.error('Error enhancing transaction:', error);
    return transaction;
  }
}

/**
 * Enhance multiple transactions in batch
 */
export async function enhanceTransactionsBatch(
  transactions: Transaction[],
  onProgress?: (current: number, total: number) => void
): Promise<Transaction[]> {
  const enhanced: Transaction[] = [];
  const batchSize = 5; // Process 5 at a time to avoid rate limits

  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    const promises = batch.map(async (transaction) => {
      const enhancedTx = await enhanceTransactionWithOpenAI(transaction);
      if (onProgress) {
        onProgress(i + batch.indexOf(transaction) + 1, transactions.length);
      }
      return enhancedTx;
    });

    const batchResults = await Promise.all(promises);
    enhanced.push(...batchResults);

    // Small delay between batches to avoid rate limits
    if (i + batchSize < transactions.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return enhanced;
}

/**
 * Get all Plaid categories
 */
export function getPlaidCategories(): PlaidCategory[] {
  return plaidCategories['Plaid Categories'] as PlaidCategory[];
}

/**
 * Get unique PRIMARY categories
 */
export function getPrimaryCategories(): string[] {
  const categories = getPlaidCategories();
  const primarySet = new Set(categories.map((c) => c.PRIMARY));
  return Array.from(primarySet).sort();
}

/**
 * Get DETAILED categories for a PRIMARY category
 */
export function getDetailedCategories(primaryCategory: string): PlaidCategory[] {
  const categories = getPlaidCategories();
  return categories.filter((c) => c.PRIMARY === primaryCategory);
}

/**
 * Validate if a category combination is valid
 */
export function isValidPlaidCategory(primaryCategory: string, detailedCategory: string): boolean {
  const categories = getPlaidCategories();
  return categories.some(
    (c) => c.PRIMARY === primaryCategory && c.DETAILED === detailedCategory
  );
}
