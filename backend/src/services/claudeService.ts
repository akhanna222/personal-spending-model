import Anthropic from '@anthropic-ai/sdk';
import { Transaction, TransactionEnhancement, Category } from '../types';
import categoryData from '../../../shared/category-data.json';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Enhance a single transaction with LLM-generated context
 */
export async function enhanceTransaction(transaction: Transaction): Promise<TransactionEnhancement> {
  const categories = categoryData.categories;

  const prompt = `You are a financial transaction analyzer. Analyze this bank transaction and provide structured information.

Transaction Details:
- Date: ${transaction.date}
- Amount: ${transaction.amount} ${transaction.currency}
- Raw Description: ${transaction.rawDescription}

Your task:
1. Create a clean, human-readable description of this transaction
2. Extract the merchant/vendor name if identifiable
3. Determine if this was online, in-store, or a subscription
4. Infer the purpose/context of the transaction
5. Categorize into PRIMARY and DETAILED categories from the list below

Available Categories:
${categories.map(c => `${c.PRIMARY} -> ${c.DETAILED}: ${c.DESCRIPTION}`).join('\n')}

Respond in JSON format:
{
  "enhancedDescription": "Clear description in natural language",
  "merchant": "Merchant name or null",
  "channel": "online" | "in-store" | "subscription" | "unknown",
  "purpose": "Brief purpose description",
  "primaryCategory": "PRIMARY_CATEGORY",
  "detailedCategory": "DETAILED_CATEGORY",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of categorization"
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Claude response');
    }

    const enhancement: TransactionEnhancement = JSON.parse(jsonMatch[0]);
    return enhancement;
  } catch (error) {
    console.error('Error enhancing transaction:', error);
    // Return fallback enhancement
    return {
      enhancedDescription: transaction.rawDescription || transaction.transaction_text,
      merchant: undefined,
      channel: 'unknown',
      primaryCategory: transaction.isIncome ? 'INCOME' : 'UNCATEGORIZED',
      detailedCategory: transaction.isIncome ? 'INCOME_OTHER' : 'UNCATEGORIZED_UNKNOWN',
      confidence: 0.1,
      reasoning: 'Error during enhancement',
    };
  }
}

/**
 * Enhance multiple transactions in batch
 * Processes in batches to avoid rate limits
 */
export async function enhanceTransactionsBatch(
  transactions: Transaction[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, TransactionEnhancement>> {
  const enhancements = new Map<string, TransactionEnhancement>();
  const batchSize = 5; // Process 5 at a time to avoid rate limits

  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    const promises = batch.map(async (transaction) => {
      const enhancement = await enhanceTransaction(transaction);
      enhancements.set(transaction.id, enhancement);
      if (onProgress) {
        onProgress(i + batch.indexOf(transaction) + 1, transactions.length);
      }
    });

    await Promise.all(promises);

    // Small delay between batches to avoid rate limits
    if (i + batchSize < transactions.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return enhancements;
}

/**
 * Get category information
 */
export function getCategories(): Category[] {
  return categoryData.categories;
}

/**
 * Get PRIMARY categories (unique list)
 */
export function getPrimaryCategories(): string[] {
  const primarySet = new Set(categoryData.categories.map(c => c.PRIMARY));
  return Array.from(primarySet);
}

/**
 * Get DETAILED categories for a given PRIMARY category
 */
export function getDetailedCategories(primaryCategory: string): Category[] {
  return categoryData.categories.filter(c => c.PRIMARY === primaryCategory);
}

/**
 * Validate if a category combination is valid
 */
export function isValidCategory(primaryCategory: string, detailedCategory: string): boolean {
  return categoryData.categories.some(
    c => c.PRIMARY === primaryCategory && c.DETAILED === detailedCategory
  );
}
