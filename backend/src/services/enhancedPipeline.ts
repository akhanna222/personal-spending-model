import { Transaction, TransactionEnhancement } from '../types';
import { extractMultiPageStatement, deduplicateTransactions, validateExtractedTransactions } from './visionParser';
import { classifyBatchToPlaid, classifyToPlaidCategory } from './plaidCategories';
import { analyzeTransactionBehavior } from './behavioralAnalyzer';

/**
 * Complete Enhanced Transaction Analysis Pipeline
 *
 * Flow:
 * 1. PDF/Image → GPT-4 Vision → Extract structured transactions
 * 2. Transaction text → LLM → Plaid category classification
 * 3. Transaction + Category → LLM → Behavioral analysis (red flags, late night, etc.)
 */

export interface EnhancedTransactionResult extends TransactionEnhancement {
  // Plaid categories
  plaidPrimaryCategory: string;
  plaidDetailedCategory: string;
  plaidConfidence: number;
  plaidReasoning: string;
}

/**
 * STEP 1: Extract transactions from PDF/Image using Vision
 */
export async function extractWithVision(
  fileBuffer: Buffer,
  fileName: string
): Promise<{
  transactions: Transaction[];
  metadata: any;
  validation: {
    valid: boolean;
    errors: string[];
  };
}> {
  console.log(`📄 [Vision] Extracting transactions from: ${fileName}`);

  const result = await extractMultiPageStatement(fileBuffer, fileName);

  // Deduplicate in case Vision extracted same transaction twice
  const deduplicated = deduplicateTransactions(result.transactions);

  // Validate extracted data
  const validation = validateExtractedTransactions(deduplicated);

  console.log(`✅ [Vision] Extracted ${deduplicated.length} transactions`);

  return {
    transactions: deduplicated,
    metadata: result.metadata,
    validation,
  };
}

/**
 * STEP 2: Classify transactions into Plaid categories
 */
export async function classifyWithPlaid(
  transactions: Transaction[],
  onProgress?: (current: number, total: number, step: string) => void
): Promise<Map<string, any>> {
  console.log(`🏷️  [Plaid] Classifying ${transactions.length} transactions`);

  const classifications = await classifyBatchToPlaid(transactions, (current, total) => {
    if (onProgress) {
      onProgress(current, total, 'Plaid Classification');
    }
  });

  console.log(`✅ [Plaid] Classified ${classifications.size} transactions`);

  return classifications;
}

/**
 * STEP 3: Analyze behavioral patterns and red flags
 */
export async function analyzeWithBehavior(
  transactions: Transaction[],
  useOpenAI: boolean = true,
  onProgress?: (current: number, total: number, step: string) => void
): Promise<Map<string, TransactionEnhancement>> {
  console.log(`🧠 [Behavioral] Analyzing ${transactions.length} transactions`);

  const enhancements = new Map<string, TransactionEnhancement>();
  const batchSize = 5;

  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);

    const promises = batch.map(async (txn) => {
      const enhancement = await analyzeTransactionBehavior(txn, useOpenAI);
      enhancements.set(txn.id, enhancement);

      if (onProgress) {
        onProgress(i + batch.indexOf(txn) + 1, transactions.length, 'Behavioral Analysis');
      }
    });

    await Promise.all(promises);

    // Rate limiting
    if (i + batchSize < transactions.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(`✅ [Behavioral] Analyzed ${enhancements.size} transactions`);

  return enhancements;
}

/**
 * COMPLETE PIPELINE: Vision → Plaid → Behavioral
 */
export async function processStatementComplete(
  fileBuffer: Buffer,
  fileName: string,
  options: {
    usePlaid?: boolean;
    analyzeBehavior?: boolean;
    llmProvider?: 'openai' | 'claude';
    onProgress?: (current: number, total: number, step: string) => void;
  } = {}
): Promise<{
  transactions: Transaction[];
  metadata: any;
  enhancements: Map<string, EnhancedTransactionResult>;
  summary: {
    totalTransactions: number;
    flaggedTransactions: number;
    highRiskTransactions: number;
    avgHealthScore: number;
    extractionValid: boolean;
  };
}> {
  const {
    usePlaid = true,
    analyzeBehavior = true,
    llmProvider = 'openai',
    onProgress,
  } = options;

  // STEP 1: Extract with Vision
  const extraction = await extractWithVision(fileBuffer, fileName);

  if (!extraction.validation.valid) {
    console.warn('⚠️  Extraction validation warnings:', extraction.validation.errors);
  }

  const { transactions } = extraction;

  // STEP 2: Plaid Classification (if enabled)
  let plaidClassifications: Map<string, any> | null = null;
  if (usePlaid) {
    plaidClassifications = await classifyWithPlaid(transactions, onProgress);
  }

  // STEP 3: Behavioral Analysis (if enabled)
  let behavioralEnhancements: Map<string, TransactionEnhancement> | null = null;
  if (analyzeBehavior) {
    const useOpenAI = llmProvider === 'openai';
    behavioralEnhancements = await analyzeWithBehavior(transactions, useOpenAI, onProgress);
  }

  // Merge all enhancements
  const enhancements = new Map<string, EnhancedTransactionResult>();

  transactions.forEach((txn) => {
    const plaid = plaidClassifications?.get(txn.id);
    const behavioral = behavioralEnhancements?.get(txn.id);

    const enhanced: EnhancedTransactionResult = {
      enhancedDescription: behavioral?.enhancedDescription || txn.rawDescription,
      merchant: behavioral?.merchant,
      channel: behavioral?.channel || 'unknown',
      purpose: behavioral?.purpose,
      primaryCategory: behavioral?.primaryCategory || plaid?.primaryCategory || 'GENERAL_MERCHANDISE',
      detailedCategory: behavioral?.detailedCategory || plaid?.detailedCategory || 'GENERAL_MERCHANDISE_OTHER_GENERAL_MERCHANDISE',
      confidence: behavioral?.confidence || plaid?.confidence || 0.5,
      reasoning: behavioral?.reasoning || plaid?.reasoning,

      // Plaid categories
      plaidPrimaryCategory: plaid?.primaryCategory || '',
      plaidDetailedCategory: plaid?.detailedCategory || '',
      plaidConfidence: plaid?.confidence || 0.0,
      plaidReasoning: plaid?.reasoning || '',

      // Behavioral analysis
      behaviorRedFlags: behavioral?.behaviorRedFlags,
      riskLevel: behavioral?.riskLevel,
      healthScore: behavioral?.healthScore,
      behaviorClassification: behavioral?.behaviorClassification,
      interventionNeeded: behavioral?.interventionNeeded,
    };

    enhancements.set(txn.id, enhanced);
  });

  // Calculate summary statistics
  const flaggedTransactions = Array.from(enhancements.values()).filter(
    (e) => e.behaviorRedFlags && e.behaviorRedFlags.length > 0
  ).length;

  const highRiskTransactions = Array.from(enhancements.values()).filter(
    (e) => e.riskLevel === 'HIGH' || e.riskLevel === 'CRITICAL'
  ).length;

  const healthScores = Array.from(enhancements.values())
    .map((e) => e.healthScore || 0)
    .filter((s) => s > 0);

  const avgHealthScore =
    healthScores.length > 0
      ? healthScores.reduce((a, b) => a + b, 0) / healthScores.length
      : 0;

  console.log(`
🎉 Pipeline Complete!
- Transactions: ${transactions.length}
- Flagged: ${flaggedTransactions}
- High Risk: ${highRiskTransactions}
- Avg Health Score: ${avgHealthScore.toFixed(1)}/100
  `);

  return {
    transactions,
    metadata: extraction.metadata,
    enhancements,
    summary: {
      totalTransactions: transactions.length,
      flaggedTransactions,
      highRiskTransactions,
      avgHealthScore,
      extractionValid: extraction.validation.valid,
    },
  };
}

/**
 * Process single transaction through Plaid + Behavioral pipeline
 */
export async function processSingleTransaction(
  transaction: Transaction,
  options: {
    usePlaid?: boolean;
    analyzeBehavior?: boolean;
    llmProvider?: 'openai' | 'claude';
  } = {}
): Promise<EnhancedTransactionResult> {
  const {
    usePlaid = true,
    analyzeBehavior = true,
    llmProvider = 'openai',
  } = options;

  let plaidCategory = null;
  let behavioral = null;

  if (usePlaid) {
    plaidCategory = await classifyToPlaidCategory(transaction);
  }

  if (analyzeBehavior) {
    const useOpenAI = llmProvider === 'openai';
    behavioral = await analyzeTransactionBehavior(transaction, useOpenAI);
  }

  return {
    enhancedDescription: behavioral?.enhancedDescription || transaction.rawDescription,
    merchant: behavioral?.merchant,
    channel: behavioral?.channel || 'unknown',
    purpose: behavioral?.purpose,
    primaryCategory: behavioral?.primaryCategory || plaidCategory?.primaryCategory || 'GENERAL_MERCHANDISE',
    detailedCategory: behavioral?.detailedCategory || plaidCategory?.detailedCategory || 'GENERAL_MERCHANDISE_OTHER_GENERAL_MERCHANDISE',
    confidence: behavioral?.confidence || plaidCategory?.confidence || 0.5,
    reasoning: behavioral?.reasoning || plaidCategory?.reasoning,

    plaidPrimaryCategory: plaidCategory?.primaryCategory || '',
    plaidDetailedCategory: plaidCategory?.detailedCategory || '',
    plaidConfidence: plaidCategory?.confidence || 0.0,
    plaidReasoning: plaidCategory?.reasoning || '',

    behaviorRedFlags: behavioral?.behaviorRedFlags,
    riskLevel: behavioral?.riskLevel,
    healthScore: behavioral?.healthScore,
    behaviorClassification: behavioral?.behaviorClassification,
    interventionNeeded: behavioral?.interventionNeeded,
  };
}
