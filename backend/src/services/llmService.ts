import { Transaction, TransactionEnhancement } from '../types';
import {
  enhanceTransaction as enhanceWithClaude,
  enhanceTransactionsBatch as enhanceBatchWithClaude,
} from './claudeService';
import {
  classifyTransactionOpenAI,
  classifyTransactionsBatchOpenAI,
  classifyTransactionMultiAgent,
} from './openaiClassifier';

// LLM Provider configuration
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'claude';
const USE_MULTI_AGENT = process.env.USE_MULTI_AGENT === 'true';

/**
 * Unified LLM service that routes to the configured provider
 */
export async function enhanceTransaction(
  transaction: Transaction
): Promise<TransactionEnhancement> {
  const provider = LLM_PROVIDER.toLowerCase();

  console.log(`Using LLM provider: ${provider}`);

  switch (provider) {
    case 'openai':
      if (USE_MULTI_AGENT) {
        console.log('Using multi-agent OpenAI classification');
        return await classifyTransactionMultiAgent(transaction);
      }
      return await classifyTransactionOpenAI(transaction);

    case 'claude':
    default:
      return await enhanceWithClaude(transaction);
  }
}

/**
 * Batch enhancement with the configured provider
 */
export async function enhanceTransactionsBatch(
  transactions: Transaction[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, TransactionEnhancement>> {
  const provider = LLM_PROVIDER.toLowerCase();

  console.log(`Batch enhancing ${transactions.length} transactions with ${provider}`);

  switch (provider) {
    case 'openai':
      return await classifyTransactionsBatchOpenAI(transactions, onProgress);

    case 'claude':
    default:
      return await enhanceBatchWithClaude(transactions, onProgress);
  }
}

/**
 * Get information about the current LLM configuration
 */
export function getLLMConfig() {
  return {
    provider: LLM_PROVIDER,
    multiAgent: USE_MULTI_AGENT,
    claudeAvailable: !!process.env.ANTHROPIC_API_KEY,
    openaiAvailable: !!process.env.OPENAI_API_KEY,
  };
}

/**
 * Validate LLM configuration
 */
export function validateLLMConfig(): { valid: boolean; error?: string } {
  const provider = LLM_PROVIDER.toLowerCase();

  switch (provider) {
    case 'openai':
      if (!process.env.OPENAI_API_KEY) {
        return {
          valid: false,
          error: 'OPENAI_API_KEY not set. Please set it in backend/.env',
        };
      }
      break;

    case 'claude':
      if (!process.env.ANTHROPIC_API_KEY) {
        return {
          valid: false,
          error: 'ANTHROPIC_API_KEY not set. Please set it in backend/.env',
        };
      }
      break;

    default:
      return {
        valid: false,
        error: `Unknown LLM_PROVIDER: ${provider}. Use 'claude' or 'openai'`,
      };
  }

  return { valid: true };
}
