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
 * VISION-FIRST EXTRACTION - NO REGEX!
 * Uses GPT-4o Vision for images/PDFs, GPT-4o for text
 * Single AI call extracts complete transaction structure
 */
export async function extractTransactionsWithVision(
  content: string | Buffer,
  fileName: string,
  contentType: 'text' | 'image'
): Promise<Transaction[]> {
  try {
    const categories = plaidCategories['Plaid Categories'] as PlaidCategory[];
    const categoryList = categories.map(c => `${c.PRIMARY} | ${c.DETAILED} | ${c.DESCRIPTION}`).join('\n');

    const systemPrompt = `You are a bank statement parser. Extract ALL transactions with complete details.

For EACH transaction, extract:
1. date (YYYY-MM-DD format)
2. transaction_text (exact text from statement)
3. payment_in (amount received, 0 if not applicable)
4. payment_out (amount spent, 0 if not applicable)
5. balance (account balance after transaction, if visible)
6. transaction_description (clear human-readable description)
7. Match to Plaid category from list below

Plaid Categories:
${categoryList}

CRITICAL RULES:
- Extract ALL transactions, even if unclear
- Only ONE of payment_in/payment_out should be non-zero
- Match categories STRICTLY from the list above
- If no good category match, leave blank
- Parse dates to YYYY-MM-DD format
- Include transaction balance if shown`;

    // Build message based on content type
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (contentType === 'image') {
      // GPT-4o Vision for images
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract ALL transactions from this bank statement image into the schema.',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${(content as Buffer).toString('base64')}`,
              detail: 'high', // High detail for better extraction
            },
          },
        ],
      });
    } else {
      // GPT-4o for text (from PDFs)
      messages.push({
        role: 'user',
        content: `Extract ALL transactions from this bank statement text:\n\n${content}`,
      });
    }

    // Use function calling for guaranteed JSON structure
    const response = await client.chat.completions.create({
      model: contentType === 'image' ? 'gpt-4o' : 'gpt-4o-mini',
      messages,
      functions: [
        {
          name: 'extract_bank_transactions',
          description: 'Extract all transactions from a bank statement',
          parameters: {
            type: 'object',
            properties: {
              transactions: {
                type: 'array',
                description: 'List of all transactions found',
                items: {
                  type: 'object',
                  properties: {
                    date: {
                      type: 'string',
                      description: 'Transaction date in YYYY-MM-DD format',
                    },
                    transaction_text: {
                      type: 'string',
                      description: 'Raw transaction text from statement',
                    },
                    payment_in: {
                      type: 'number',
                      description: 'Amount received (0 if not applicable)',
                    },
                    payment_out: {
                      type: 'number',
                      description: 'Amount paid (0 if not applicable)',
                    },
                    balance: {
                      type: 'number',
                      description: 'Account balance after transaction',
                    },
                    transaction_description: {
                      type: 'string',
                      description: 'Clear, human-readable description',
                    },
                    transaction_primary: {
                      type: 'string',
                      description: 'Plaid PRIMARY category',
                    },
                    transaction_detailed: {
                      type: 'string',
                      description: 'Plaid DETAILED category',
                    },
                  },
                  required: [
                    'date',
                    'transaction_text',
                    'payment_in',
                    'payment_out',
                    'transaction_description',
                  ],
                },
              },
            },
            required: ['transactions'],
          },
        },
      ],
      function_call: { name: 'extract_bank_transactions' },
      temperature: 0.1,
    });

    const functionCall = response.choices[0]?.message?.function_call;
    if (!functionCall?.arguments) {
      throw new Error('No function call in response');
    }

    const result = JSON.parse(functionCall.arguments);

    // Validate and enrich transactions
    return result.transactions.map((tx: any) => {
      // Validate Plaid categories
      const categoryValid = categories.some(
        c => c.PRIMARY === tx.transaction_primary && c.DETAILED === tx.transaction_detailed
      );

      // Clear invalid categories
      if (!categoryValid) {
        tx.transaction_primary = undefined;
        tx.transaction_detailed = undefined;
      }

      // Ensure amount fields are numbers
      const payment_in = parseFloat(tx.payment_in) || 0;
      const payment_out = parseFloat(tx.payment_out) || 0;
      const balance = tx.balance ? parseFloat(tx.balance) : undefined;

      return {
        id: uuidv4(),
        date: tx.date,
        transaction_text: tx.transaction_text,
        payment_in,
        payment_out,
        balance,
        transaction_description: tx.transaction_description,
        transaction_primary: tx.transaction_primary,
        transaction_detailed: tx.transaction_detailed,

        // Legacy fields for backward compatibility
        amount: payment_in > 0 ? payment_in : -payment_out,
        currency: 'EUR',
        rawDescription: tx.transaction_text,
        isIncome: payment_in > 0,
      } as Transaction;
    });
  } catch (error) {
    console.error('Vision extraction failed:', error);
    throw new Error(`Vision extraction failed: ${error}`);
  }
}

/**
 * Batch enhancement (optional, for CSV-imported transactions)
 */
export async function enhanceTransactionsBatchVision(
  transactions: Transaction[],
  onProgress?: (current: number, total: number) => void
): Promise<Transaction[]> {
  const categories = plaidCategories['Plaid Categories'] as PlaidCategory[];
  const categoryList = categories.map(c => `${c.PRIMARY}|${c.DETAILED}`).join('\n');

  const enhanced: Transaction[] = [];
  const batchSize = 10;

  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Categorize transactions. Match to Plaid categories:\n${categoryList}`,
          },
          {
            role: 'user',
            content: `Categorize:\n${batch
              .map(
                (tx, idx) =>
                  `${idx}: ${tx.transaction_text} | ${
                    tx.payment_in > 0 ? `IN ${tx.payment_in}` : `OUT ${tx.payment_out}`
                  }`
              )
              .join('\n')}`,
          },
        ],
        functions: [
          {
            name: 'categorize',
            parameters: {
              type: 'object',
              properties: {
                results: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      index: { type: 'number' },
                      description: { type: 'string' },
                      primary: { type: 'string' },
                      detailed: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        ],
        function_call: { name: 'categorize' },
        temperature: 0.1,
      });

      const result = JSON.parse(response.choices[0]?.message?.function_call?.arguments || '{}');

      result.results?.forEach((r: any) => {
        const tx = batch[r.index];
        if (tx) {
          const valid = categories.some(
            c => c.PRIMARY === r.primary && c.DETAILED === r.detailed
          );

          enhanced.push({
            ...tx,
            transaction_description: r.description,
            transaction_primary: valid ? r.primary : undefined,
            transaction_detailed: valid ? r.detailed : undefined,
          });
        }
      });

      if (onProgress) {
        onProgress(Math.min(i + batchSize, transactions.length), transactions.length);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Batch failed:`, error);
      enhanced.push(...batch);
    }
  }

  return enhanced;
}

// Category helpers
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
