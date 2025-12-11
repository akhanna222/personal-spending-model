import OpenAI from 'openai';
import { Transaction, TransactionEnhancement, Category } from '../types';
import categoryData from '../../../shared/category-data.json';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model configuration
const OPENAI_MODEL = 'gpt-4o-mini'; // Fast and cost-effective
// const OPENAI_MODEL = 'gpt-4o'; // More accurate, higher cost

// Build category choices text
const buildCategoryChoices = (isIncome: boolean): string => {
  const relevantCategories = categoryData.categories.filter(cat =>
    isIncome ? cat.PRIMARY === 'INCOME' : cat.PRIMARY !== 'INCOME'
  );

  return relevantCategories
    .slice(0, 50) // Limit to avoid token limits
    .map(cat => `${cat.PRIMARY} -> ${cat.DETAILED}: ${cat.DESCRIPTION}`)
    .join('\n');
};

/**
 * Classification template for structured JSON response
 */
interface ClassificationTemplate {
  enhanced_description: string;
  merchant: string | null;
  channel: 'online' | 'in-store' | 'subscription' | 'unknown';
  purpose: string;
  primary_category: string;
  detailed_category: string;
  confidence: number;
  reasoning: string;
}

/**
 * Ensure all template keys exist in response data
 */
function ensureKeys(template: ClassificationTemplate, data: any): ClassificationTemplate {
  const result = { ...template };
  for (const key in template) {
    if (key in data) {
      result[key as keyof ClassificationTemplate] = data[key];
    }
  }
  return result;
}

// ==========================================
// 1. SINGLE TRANSACTION CLASSIFICATION
// ==========================================

/**
 * Classify a single transaction using OpenAI with JSON mode
 */
export async function classifyTransactionOpenAI(
  transaction: Transaction
): Promise<TransactionEnhancement> {
  const template: ClassificationTemplate = {
    enhanced_description: '',
    merchant: null,
    channel: 'unknown',
    purpose: '',
    primary_category: '',
    detailed_category: '',
    confidence: 0.0,
    reasoning: '',
  };

  const systemPrompt = `You are an expert financial transaction classifier for a personal spending analysis system.

Your task is to analyze bank transaction descriptions and categorize them accurately.

You must:
1. Extract the merchant name if identifiable
2. Determine transaction channel (online, in-store, subscription, unknown)
3. Infer the purpose of the transaction
4. Classify into PRIMARY and DETAILED categories from the provided taxonomy
5. Provide a confidence score (0.0 to 1.0)
6. Explain your reasoning

Return ONLY valid JSON matching the template provided.`;

  const categorySection = buildCategoryChoices(transaction.isIncome);

  const userInstructions = `
Analyze this bank transaction:

Transaction Date: ${transaction.date}
Amount: ${transaction.currency} ${Math.abs(transaction.amount).toFixed(2)}
Type: ${transaction.isIncome ? 'INCOME' : 'EXPENSE'}
Raw Description: ${transaction.rawDescription}

Available Categories:
${categorySection}

Provide a detailed analysis and classification.

JSON_TEMPLATE:
${JSON.stringify(template, null, 2)}

Rules:
- enhanced_description: Create a clear, human-readable description
- merchant: Extract merchant name or null if unknown
- channel: Must be one of: "online", "in-store", "subscription", "unknown"
- purpose: Brief explanation of transaction purpose
- primary_category: Must match a PRIMARY category from the list
- detailed_category: Must match the corresponding DETAILED category
- confidence: Float between 0.0 and 1.0
- reasoning: Explain why you chose this categorization
`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInstructions },
      ],
      temperature: 0.0,
      max_tokens: 800,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const data = JSON.parse(content);
    const classification = ensureKeys(template, data);

    return {
      enhancedDescription: classification.enhanced_description,
      merchant: classification.merchant || undefined,
      channel: classification.channel,
      primaryCategory: classification.primary_category,
      detailedCategory: classification.detailed_category,
      confidence: classification.confidence,
      reasoning: classification.reasoning,
    };
  } catch (error) {
    console.error('Error in OpenAI classification:', error);
    // Return fallback classification
    return {
      enhancedDescription: transaction.rawDescription,
      merchant: undefined,
      channel: 'unknown',
      primaryCategory: transaction.isIncome ? 'INCOME' : 'UNCATEGORIZED',
      detailedCategory: transaction.isIncome
        ? 'INCOME_OTHER'
        : 'UNCATEGORIZED_UNKNOWN',
      confidence: 0.1,
      reasoning: 'Classification failed',
    };
  }
}

// ==========================================
// 2. BATCH CLASSIFICATION
// ==========================================

/**
 * Classify multiple transactions in batch with progress tracking
 */
export async function classifyTransactionsBatchOpenAI(
  transactions: Transaction[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, TransactionEnhancement>> {
  const enhancements = new Map<string, TransactionEnhancement>();
  const batchSize = 5; // Process 5 at a time

  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);

    const promises = batch.map(async (transaction) => {
      const enhancement = await classifyTransactionOpenAI(transaction);
      enhancements.set(transaction.id, enhancement);

      if (onProgress) {
        onProgress(i + batch.indexOf(transaction) + 1, transactions.length);
      }
    });

    await Promise.all(promises);

    // Small delay between batches to avoid rate limits
    if (i + batchSize < transactions.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return enhancements;
}

// ==========================================
// 3. MULTI-AGENT CLASSIFICATION (Advanced)
// ==========================================

interface MerchantInfo {
  merchant: string | null;
  channel: 'online' | 'in-store' | 'subscription' | 'unknown';
  merchant_category: string;
  location: string | null;
}

interface CategoryInfo {
  primary_category: string;
  detailed_category: string;
  enhanced_description: string;
  purpose: string;
  confidence: number;
  reasoning: string;
}

/**
 * Agent 1: Extract merchant and transaction details
 */
async function extractMerchantAgent(transactionText: string): Promise<MerchantInfo> {
  const systemPrompt = `You are a merchant extraction specialist.
Extract merchant name, transaction channel, and other metadata from bank transaction descriptions.
Return only valid JSON.`;

  const userPrompt = `
Extract information from this transaction:
"${transactionText}"

Return JSON with:
{
  "merchant": "merchant name or null",
  "channel": "online | in-store | subscription | unknown",
  "merchant_category": "type of business (e.g., grocery, restaurant, gas station)",
  "location": "location if mentioned, else null"
}
`;

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

  return JSON.parse(response.choices[0].message.content || '{}');
}

/**
 * Agent 2: Classify into spending categories
 */
async function classifyCategoryAgent(
  transactionText: string,
  merchant: string | null,
  amount: number,
  date: string,
  isIncome: boolean
): Promise<CategoryInfo> {
  const categorySection = buildCategoryChoices(isIncome);

  const systemPrompt = `You are a transaction categorization expert.
Given merchant and transaction details, classify into the correct spending category.
Return only valid JSON.`;

  const userPrompt = `
Categorize this transaction:

Date: ${date}
Amount: €${Math.abs(amount).toFixed(2)}
Type: ${isIncome ? 'INCOME' : 'EXPENSE'}
Description: ${transactionText}
Merchant: ${merchant || 'Unknown'}

Categories:
${categorySection}

Return JSON:
{
  "primary_category": "PRIMARY category",
  "detailed_category": "DETAILED category",
  "enhanced_description": "clear human description",
  "purpose": "why this purchase was made",
  "confidence": 0.0-1.0,
  "reasoning": "explanation"
}
`;

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.0,
    max_tokens: 500,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

/**
 * Agent 3: Validate and merge results
 */
async function validationAgent(
  transactionText: string,
  classification: CategoryInfo,
  merchantInfo: MerchantInfo
): Promise<ClassificationTemplate> {
  const systemPrompt = `You are a classification validator.
Review the classification and ensure it's accurate and consistent.
Return only valid JSON.`;

  const userPrompt = `
Validate this classification:

Original Transaction: ${transactionText}

Merchant Info: ${JSON.stringify(merchantInfo, null, 2)}
Classification: ${JSON.stringify(classification, null, 2)}

Check:
1. Is the category appropriate for this merchant?
2. Is the confidence score reasonable?
3. Does the enhanced description make sense?

Return validated JSON:
{
  "enhanced_description": "validated description",
  "merchant": "merchant name or null",
  "channel": "online | in-store | subscription | unknown",
  "purpose": "validated purpose",
  "primary_category": "validated PRIMARY",
  "detailed_category": "validated DETAILED",
  "confidence": 0.0-1.0,
  "reasoning": "validation notes"
}
`;

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.0,
    max_tokens: 500,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

/**
 * Multi-agent classification using chain-of-thought
 * Provides higher accuracy but uses more tokens
 */
export async function classifyTransactionMultiAgent(
  transaction: Transaction
): Promise<TransactionEnhancement> {
  try {
    // AGENT 1: Merchant Extraction
    const merchantInfo = await extractMerchantAgent(transaction.rawDescription);

    // AGENT 2: Category Classification
    const categoryInfo = await classifyCategoryAgent(
      transaction.rawDescription,
      merchantInfo.merchant,
      transaction.amount,
      transaction.date,
      transaction.isIncome
    );

    // AGENT 3: Validation
    const finalResult = await validationAgent(
      transaction.rawDescription,
      categoryInfo,
      merchantInfo
    );

    return {
      enhancedDescription: finalResult.enhanced_description,
      merchant: finalResult.merchant || undefined,
      channel: finalResult.channel,
      primaryCategory: finalResult.primary_category,
      detailedCategory: finalResult.detailed_category,
      confidence: finalResult.confidence,
      reasoning: finalResult.reasoning,
    };
  } catch (error) {
    console.error('Error in multi-agent classification:', error);
    // Fallback to single-agent
    return classifyTransactionOpenAI(transaction);
  }
}

// ==========================================
// 4. CATEGORY VALIDATION
// ==========================================

/**
 * Validate that a PRIMARY + DETAILED category combination exists
 */
export function validateCategory(primaryCategory: string, detailedCategory: string): boolean {
  return categoryData.categories.some(
    (c) => c.PRIMARY === primaryCategory && c.DETAILED === detailedCategory
  );
}

/**
 * Get the description for a detailed category
 */
export function getCategoryDescription(detailedCategory: string): string | undefined {
  const category = categoryData.categories.find((c) => c.DETAILED === detailedCategory);
  return category?.DESCRIPTION;
}
