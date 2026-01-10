import express from 'express';
import fileUpload from 'express-fileupload';
import { parseCSV, parsePDF } from '../utils/parser';
import {
  enhanceTransaction,
  enhanceTransactionsBatch,
  getLLMConfig,
  validateLLMConfig,
} from '../services/llmService';
import {
  getCategories,
  getPrimaryCategories,
  getDetailedCategories,
  isValidCategory,
} from '../services/claudeService';
import { generateInsights } from '../services/behavioralModel';
import {
  analyzeTransactionBehavior,
  analyzeBatchWithBehavior,
  aggregateBehavioralRisks,
} from '../services/behavioralAnalyzer';
import {
  processStatementComplete,
  processSingleTransaction,
} from '../services/enhancedPipeline';
import { Transaction } from '../types';

const router = express.Router();

// In-memory storage (in production, use a database)
let transactions: Transaction[] = [];
let uploadedStatements: any[] = [];

/**
 * POST /api/upload-enhanced
 * Enhanced pipeline: Vision → Plaid → Behavioral Analysis
 * Supports: Multi-page PDF, Images (PNG, JPG)
 */
router.post('/upload-enhanced', async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = Array.isArray(req.files.statements)
      ? req.files.statements
      : [req.files.statements];

    const results = [];

    // Get options from request body
    const usePlaid = req.body.usePlaid !== 'false'; // Default true
    const analyzeBehavior = req.body.analyzeBehavior !== 'false'; // Default true
    const llmProvider = req.body.llmProvider || 'openai';

    for (const file of files) {
      const fileBuffer = file.data;
      const fileName = file.name;

      try {
        console.log(`\n🚀 Processing: ${fileName} with enhanced pipeline`);

        // Run complete pipeline: Vision → Plaid → Behavioral
        const result = await processStatementComplete(fileBuffer, fileName, {
          usePlaid,
          analyzeBehavior,
          llmProvider,
          onProgress: (current, total, step) => {
            console.log(`  ${step}: ${current}/${total}`);
          },
        });

        // Add transactions to global store
        result.transactions.forEach((txn) => {
          const enhancement = result.enhancements.get(txn.id);
          if (enhancement) {
            txn.enhancedDescription = enhancement.enhancedDescription;
            txn.merchant = enhancement.merchant;
            txn.channel = enhancement.channel;
            txn.primaryCategory = enhancement.primaryCategory;
            txn.detailedCategory = enhancement.detailedCategory;
            txn.categoryConfidence = enhancement.confidence;

            // Behavioral fields
            txn.behaviorRedFlags = enhancement.behaviorRedFlags;
            txn.riskLevel = enhancement.riskLevel;
            txn.healthScore = enhancement.healthScore;
            txn.behaviorClassification = enhancement.behaviorClassification;
            txn.interventionNeeded = enhancement.interventionNeeded;
          }
        });

        transactions.push(...result.transactions);

        // Store statement metadata
        uploadedStatements.push({
          id: fileName,
          fileName,
          fileType: fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
          uploadDate: new Date().toISOString(),
          pageCount: result.metadata.pageCount,
          transactionCount: result.transactions.length,
          dateRange: result.metadata.dateRange,
          bankName: result.metadata.bankName,
          accountNumber: result.metadata.accountNumber,
        });

        results.push({
          fileName,
          success: true,
          transactionCount: result.transactions.length,
          dateRange: result.metadata.dateRange,
          summary: result.summary,
          bankName: result.metadata.bankName,
          accountNumber: result.metadata.accountNumber?.slice(-4), // Last 4 digits only
        });
      } catch (error: any) {
        console.error(`Error processing ${fileName}:`, error);
        results.push({
          fileName,
          success: false,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      results,
      totalTransactions: transactions.length,
      pipeline: {
        vision: true,
        plaid: usePlaid,
        behavioral: analyzeBehavior,
        llmProvider,
      },
    });
  } catch (error: any) {
    console.error('Upload enhanced error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/upload
 * Upload and parse bank statements (legacy text-based parser)
 */
router.post('/upload', async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = Array.isArray(req.files.statements)
      ? req.files.statements
      : [req.files.statements];

    const results = [];

    for (const file of files) {
      const fileBuffer = file.data;
      const fileName = file.name;
      const fileType = fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'csv';

      let parsed;
      if (fileType === 'pdf') {
        parsed = await parsePDF(fileBuffer, fileName);
      } else if (fileType === 'csv') {
        parsed = await parseCSV(fileBuffer, fileName);
      } else {
        results.push({ fileName, error: 'Unsupported file type' });
        continue;
      }

      // Add transactions to global store
      transactions.push(...parsed.transactions);

      // Store statement metadata
      uploadedStatements.push({
        id: fileName,
        fileName,
        fileType,
        uploadDate: new Date().toISOString(),
        pageCount: parsed.metadata.pageCount,
        transactionCount: parsed.transactions.length,
        dateRange: parsed.metadata.dateRange,
      });

      results.push({
        fileName,
        success: true,
        transactionCount: parsed.transactions.length,
        dateRange: parsed.metadata.dateRange,
      });
    }

    res.json({
      success: true,
      results,
      totalTransactions: transactions.length,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/transactions
 * Get all transactions with optional filtering
 */
router.get('/transactions', (req, res) => {
  try {
    let filtered = [...transactions];

    // Filter by date range
    if (req.query.startDate) {
      filtered = filtered.filter(t => t.date >= (req.query.startDate as string));
    }
    if (req.query.endDate) {
      filtered = filtered.filter(t => t.date <= (req.query.endDate as string));
    }

    // Filter by category
    if (req.query.primaryCategory) {
      filtered = filtered.filter(t => t.primaryCategory === req.query.primaryCategory);
    }

    // Filter by confidence
    if (req.query.minConfidence) {
      const minConf = parseFloat(req.query.minConfidence as string);
      filtered = filtered.filter(t => (t.categoryConfidence || 0) >= minConf);
    }

    // Search
    if (req.query.search) {
      const search = (req.query.search as string).toLowerCase();
      filtered = filtered.filter(
        t =>
          t.rawDescription.toLowerCase().includes(search) ||
          (t.enhancedDescription?.toLowerCase() || '').includes(search) ||
          (t.merchant?.toLowerCase() || '').includes(search)
      );
    }

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    res.json({
      transactions: filtered.slice(startIndex, endIndex),
      total: filtered.length,
      page,
      totalPages: Math.ceil(filtered.length / limit),
    });
  } catch (error: any) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/transactions/enhance
 * Enhance transactions with LLM
 */
router.post('/transactions/enhance', async (req, res) => {
  try {
    const { transactionIds } = req.body;

    if (!transactionIds || !Array.isArray(transactionIds)) {
      return res.status(400).json({ error: 'transactionIds array required' });
    }

    const toEnhance = transactions.filter(t => transactionIds.includes(t.id));
    if (toEnhance.length === 0) {
      return res.status(404).json({ error: 'No matching transactions found' });
    }

    // Enhance in batch
    const enhancements = await enhanceTransactionsBatch(toEnhance, (current, total) => {
      // Could emit progress via WebSocket in production
      console.log(`Enhanced ${current}/${total} transactions`);
    });

    // Apply enhancements to transactions
    toEnhance.forEach(t => {
      const enhancement = enhancements.get(t.id);
      if (enhancement) {
        t.enhancedDescription = enhancement.enhancedDescription;
        t.merchant = enhancement.merchant || undefined;
        t.channel = enhancement.channel;
        t.primaryCategory = enhancement.primaryCategory;
        t.detailedCategory = enhancement.detailedCategory;
        t.categoryConfidence = enhancement.confidence;
      }
    });

    res.json({
      success: true,
      enhanced: toEnhance.length,
    });
  } catch (error: any) {
    console.error('Enhancement error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/transactions/analyze-behavior
 * Analyze transactions with behavioral red flag detection
 */
router.post('/transactions/analyze-behavior', async (req, res) => {
  try {
    const { transactionIds, llmProvider } = req.body;

    if (!transactionIds || !Array.isArray(transactionIds)) {
      return res.status(400).json({ error: 'transactionIds array required' });
    }

    const toAnalyze = transactions.filter(t => transactionIds.includes(t.id));
    if (toAnalyze.length === 0) {
      return res.status(404).json({ error: 'No matching transactions found' });
    }

    // Use OpenAI by default for behavioral analysis (more cost-effective)
    const useOpenAI = llmProvider === 'claude' ? false : true;

    // Analyze in batch with behavioral detection
    const enhancements = await analyzeBatchWithBehavior(toAnalyze, useOpenAI, (current, total) => {
      console.log(`Analyzed ${current}/${total} transactions with behavioral detection`);
    });

    // Apply enhancements including behavioral flags
    toAnalyze.forEach(t => {
      const enhancement = enhancements.get(t.id);
      if (enhancement) {
        t.enhancedDescription = enhancement.enhancedDescription;
        t.merchant = enhancement.merchant || undefined;
        t.channel = enhancement.channel;
        t.primaryCategory = enhancement.primaryCategory;
        t.detailedCategory = enhancement.detailedCategory;
        t.categoryConfidence = enhancement.confidence;

        // Behavioral analysis fields
        t.behaviorRedFlags = enhancement.behaviorRedFlags;
        t.riskLevel = enhancement.riskLevel;
        t.healthScore = enhancement.healthScore;
        t.behaviorClassification = enhancement.behaviorClassification;
        t.interventionNeeded = enhancement.interventionNeeded;
      }
    });

    // Get aggregated behavioral risks across all analyzed transactions
    const aggregatedRisks = aggregateBehavioralRisks(enhancements);

    res.json({
      success: true,
      analyzed: toAnalyze.length,
      behavioralInsights: aggregatedRisks,
      transactions: toAnalyze,
    });
  } catch (error: any) {
    console.error('Behavioral analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/behavioral-risks
 * Get aggregated behavioral risk insights across all transactions
 */
router.get('/behavioral-risks', (req, res) => {
  try {
    // Filter transactions that have been analyzed (have behavioral data)
    const analyzedTransactions = transactions.filter(t => t.behaviorRedFlags !== undefined);

    if (analyzedTransactions.length === 0) {
      return res.json({
        message: 'No transactions have been analyzed for behavioral risks yet',
        totalTransactions: transactions.length,
        analyzedTransactions: 0,
      });
    }

    // Convert to Map format expected by aggregateBehavioralRisks
    const enhancementsMap = new Map();
    analyzedTransactions.forEach(t => {
      enhancementsMap.set(t.id, {
        enhancedDescription: t.enhancedDescription || t.rawDescription,
        merchant: t.merchant,
        channel: t.channel || 'unknown',
        primaryCategory: t.primaryCategory || 'UNCATEGORIZED',
        detailedCategory: t.detailedCategory || 'UNCATEGORIZED_UNKNOWN',
        confidence: t.categoryConfidence || 0,
        behaviorRedFlags: t.behaviorRedFlags,
        riskLevel: t.riskLevel,
        healthScore: t.healthScore,
        behaviorClassification: t.behaviorClassification,
        interventionNeeded: t.interventionNeeded,
      });
    });

    const risks = aggregateBehavioralRisks(enhancementsMap);

    res.json({
      ...risks,
      totalTransactions: transactions.length,
      analyzedTransactions: analyzedTransactions.length,
    });
  } catch (error: any) {
    console.error('Get behavioral risks error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/transactions/:id
 * Update a transaction (e.g., correct category)
 */
router.patch('/transactions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const transaction = transactions.find(t => t.id === id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Validate category if provided
    if (updates.primaryCategory && updates.detailedCategory) {
      if (!isValidCategory(updates.primaryCategory, updates.detailedCategory)) {
        return res.status(400).json({ error: 'Invalid category combination' });
      }
    }

    // Apply updates
    Object.assign(transaction, updates);

    res.json({ success: true, transaction });
  } catch (error: any) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/categories
 * Get all available categories
 */
router.get('/categories', (req, res) => {
  try {
    res.json({
      categories: getCategories(),
      primaryCategories: getPrimaryCategories(),
    });
  } catch (error: any) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/categories/:primary
 * Get detailed categories for a primary category
 */
router.get('/categories/:primary', (req, res) => {
  try {
    const { primary } = req.params;
    const detailed = getDetailedCategories(primary);
    res.json({ detailedCategories: detailed });
  } catch (error: any) {
    console.error('Get detailed categories error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/insights
 * Generate behavioral spending insights
 */
router.get('/insights', (req, res) => {
  try {
    if (transactions.length === 0) {
      return res.status(400).json({ error: 'No transactions available for analysis' });
    }

    const insights = generateInsights(transactions);
    res.json(insights);
  } catch (error: any) {
    console.error('Generate insights error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/export/csv
 * Export transactions as CSV
 */
router.get('/export/csv', (req, res) => {
  try {
    // Generate CSV
    const headers = [
      'Date',
      'Amount',
      'Currency',
      'Raw Description',
      'Enhanced Description',
      'Merchant',
      'Primary Category',
      'Detailed Category',
      'Confidence',
      'Is Income',
      'Is Recurring',
      'Channel',
    ];

    const rows = transactions.map(t => [
      t.date,
      t.amount,
      t.currency,
      t.rawDescription,
      t.enhancedDescription || '',
      t.merchant || '',
      t.primaryCategory || '',
      t.detailedCategory || '',
      t.categoryConfidence || '',
      t.isIncome,
      t.isRecurring || false,
      t.channel || '',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csv);
  } catch (error: any) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/llm-config
 * Get LLM provider configuration
 */
router.get('/llm-config', (req, res) => {
  try {
    const config = getLLMConfig();
    const validation = validateLLMConfig();

    res.json({
      ...config,
      configured: validation.valid,
      error: validation.error,
    });
  } catch (error: any) {
    console.error('LLM config error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/transactions
 * Clear all transactions (for testing/demo)
 */
router.delete('/transactions', (req, res) => {
  transactions = [];
  uploadedStatements = [];
  res.json({ success: true, message: 'All data cleared' });
});

export default router;
