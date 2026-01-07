import OpenAI from 'openai';
import { Transaction } from '../types';
import plaidCategories from '../../../shared/plaid-categories.json';
import { v4 as uuidv4 } from 'uuid';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PlaidCategory {
  PRIMARY: string;
  DETAILED: string;
  DESCRIPTION: string;
}

/**
 * OPTIMIZED: Single AI call to extract ALL transactions from raw text/image
 * Uses function calling for structured output
 */
export async function extractTransactionsWithAI(
  content: string | Buffer,
  fileName: string,
  isImage: boolean = false
): Promise<Transaction[]> {
  try {
    const categories = plaidCategories['Plaid Categories'] as PlaidCategory[];
    const categoryText = categories.map(c => `${c.PRIMARY}|${c.DETAILED}`).join('\n');

    // Build message content based on type
    const messageContent: any[] = isImage
      ? [
          {
            type: 'text',
            text: `Extract ALL transactions from this bank statement image. For each transaction, extract: date, description, payment_in (if money received), payment_out (if money spent), and balance (if shown).`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${(content as Buffer).toString('base64')}`,
            },
          },
        ]
      : [
          {
            type: 'text',
            text: `Extract ALL transactions from this bank statement text:\n\n${content}\n\nFor each transaction, extract: date, description, payment_in (if money received), payment_out (if money spent), and balance (if shown).`,
          },
        ];

    // Use function calling for structured extraction
    const response = await client.chat.completions.create({
      model: isImage ? 'gpt-4o' : 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a bank statement parser. Extract transactions with precision. For each transaction:
1. Parse date to YYYY-MM-DD format
2. Extract clear description
3. Determine payment_in (money received) or payment_out (money spent) - only one should be non-zero
4. Extract balance if visible
5. Generate human-readable description
6. Match to Plaid category (PRIMARY|DETAILED)

Available categories:
${categoryText}`,
        },
        { role: 'user', content: messageContent },
      ],
      functions: [
        {
          name: 'extract_transactions',
          description: 'Extract all transactions from bank statement',
          parameters: {
            type: 'object',
            properties: {
              transactions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
                    transaction_text: { type: 'string', description: 'Raw transaction text' },
                    payment_in: { type: 'number', description: 'Amount received (0 if not applicable)' },
                    payment_out: { type: 'number', description: 'Amount paid (0 if not applicable)' },
                    balance: { type: 'number', description: 'Account balance after transaction' },
                    transaction_description: { type: 'string', description: 'Human-readable description' },
                    transaction_primary: { type: 'string', description: 'Plaid PRIMARY category' },
                    transaction_detailed: { type: 'string', description: 'Plaid DETAILED category' },
                  },
                  required: ['date', 'transaction_text', 'payment_in', 'payment_out', 'transaction_description'],
                },
              },
            },
            required: ['transactions'],
          },
        },
      ],
      function_call: { name: 'extract_transactions' },
      temperature: 0.1,
    });

    const functionCall = response.choices[0]?.message?.function_call;
    if (!functionCall) {
      throw new Error('No function call in response');
    }

    const result = JSON.parse(functionCall.arguments);

    // Add IDs and validate categories
    return result.transactions.map((tx: any) => {
      // Validate Plaid categories
      const isValid = categories.some(
        c => c.PRIMARY === tx.transaction_primary && c.DETAILED === tx.transaction_detailed
      );

      if (!isValid) {
        tx.transaction_primary = undefined;
        tx.transaction_detailed = undefined;
      }

      return {
        id: uuidv4(),
        ...tx,
        // Legacy fields for compatibility
        amount: tx.payment_in > 0 ? tx.payment_in : -tx.payment_out,
        currency: 'EUR',
        rawDescription: tx.transaction_text,
        isIncome: tx.payment_in > 0,
      };
    });
  } catch (error) {
    console.error('Error extracting transactions with AI:', error);
    throw new Error(`AI extraction failed: ${error}`);
  }
}

/**
 * OPTIMIZED: Batch enhance transactions with single AI call per batch
 */
export async function enhanceTransactionsBatchOptimized(
  transactions: Transaction[],
  onProgress?: (current: number, total: number) => void
): Promise<Transaction[]> {
  const categories = plaidCategories['Plaid Categories'] as PlaidCategory[];
  const categoryText = categories.map(c => `${c.PRIMARY}|${c.DETAILED}`).join('\n');

  const enhanced: Transaction[] = [];
  const batchSize = 10; // Process 10 at a time

  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);

    try {
      // Single AI call for entire batch
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a transaction categorizer. For each transaction, provide:
1. Clear human-readable description
2. Matching Plaid category (PRIMARY|DETAILED)

Categories:
${categoryText}`,
          },
          {
            role: 'user',
            content: `Categorize these transactions:\n${batch.map((tx, idx) =>
              `${idx}: ${tx.transaction_text} | ${tx.payment_in > 0 ? `IN ${tx.payment_in}` : `OUT ${tx.payment_out}`}`
            ).join('\n')}`,
          },
        ],
        functions: [
          {
            name: 'categorize_batch',
            parameters: {
              type: 'object',
              properties: {
                results: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      index: { type: 'number' },
                      transaction_description: { type: 'string' },
                      transaction_primary: { type: 'string' },
                      transaction_detailed: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        ],
        function_call: { name: 'categorize_batch' },
        temperature: 0.1,
      });

      const result = JSON.parse(response.choices[0]?.message?.function_call?.arguments || '{}');

      // Apply results to transactions
      result.results?.forEach((r: any) => {
        const tx = batch[r.index];
        if (tx) {
          // Validate category
          const isValid = categories.some(
            c => c.PRIMARY === r.transaction_primary && c.DETAILED === r.transaction_detailed
          );

          enhanced.push({
            ...tx,
            transaction_description: r.transaction_description,
            transaction_primary: isValid ? r.transaction_primary : undefined,
            transaction_detailed: isValid ? r.transaction_detailed : undefined,
          });
        }
      });

      if (onProgress) {
        onProgress(Math.min(i + batchSize, transactions.length), transactions.length);
      }

      // Rate limiting
      if (i + batchSize < transactions.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Batch ${i}-${i + batchSize} failed:`, error);
      // Add originals on failure
      enhanced.push(...batch);
    }
  }

  return enhanced;
}

// Keep original exports for backward compatibility
export function getPlaidCategories(): PlaidCategory[] {
  return plaidCategories['Plaid Categories'] as PlaidCategory[];
}

export function getPrimaryCategories(): string[] {
  return [...new Set(getPlaidCategories().map(c => c.PRIMARY))].sort();
}

export function getDetailedCategories(primaryCategory: string): PlaidCategory[] {
  return getPlaidCategories().filter(c => c.PRIMARY === primaryCategory);
}

export function isValidPlaidCategory(primaryCategory: string, detailedCategory: string): boolean {
  return getPlaidCategories().some(
    c => c.PRIMARY === primaryCategory && c.DETAILED === detailedCategory
  );
}
