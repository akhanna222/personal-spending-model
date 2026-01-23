import express from 'express';
import { parseStatement } from '../utils/parser.optimized';
import {
  enhanceTransactionsBatchOptimized,
  getPlaidCategories,
  getPrimaryCategories,
  getDetailedCategories,
  isValidPlaidCategory,
} from '../services/openaiService.optimized';
import { generateInsights } from '../services/behavioralModel';
import { Transaction } from '../types';

const router = express.Router();

// In-memory storage (use DB in production)
const store = {
  transactions: [] as Transaction[],
  statements: [] as any[],
};

/**
 * OPTIMIZED: Single upload endpoint for all formats
 * Handles PDF, CSV, and images uniformly
 */
router.post('/upload', async (req, res) => {
  try {
    if (!req.files?.statements) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = Array.isArray(req.files.statements)
      ? req.files.statements
      : [req.files.statements];

    // Process all files in parallel
    const results = await Promise.allSettled(
      files.map(async (file) => {
        const parsed = await parseStatement(file.data, file.name);

        // Add to store
        store.transactions.push(...parsed.transactions);
        store.statements.push({
          id: file.name,
          uploadDate: new Date().toISOString(),
          transactionCount: parsed.transactions.length,
          ...parsed.metadata,
        });

        return {
          fileName: file.name,
          success: true,
          transactionCount: parsed.transactions.length,
          dateRange: parsed.metadata.dateRange,
        };
      })
    );

    // Separate successes and failures
    const successes = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const failures = results
      .filter(r => r.status === 'rejected')
      .map((r, i) => ({
        fileName: files[i].name,
        error: r.reason?.message || 'Upload failed',
      }));

    res.json({
      success: true,
      results: [...successes, ...failures],
      totalTransactions: store.transactions.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * OPTIMIZED: Simplified enhancement with batch processing
 */
router.post('/transactions/enhance', async (req, res) => {
  try {
    const { transactionIds } = req.body;

    if (!transactionIds?.length) {
      return res.status(400).json({ error: 'transactionIds array required' });
    }

    const toEnhance = store.transactions.filter(t => transactionIds.includes(t.id));
    if (!toEnhance.length) {
      return res.status(404).json({ error: 'No matching transactions' });
    }

    // Enhanced batch processing
    const enhanced = await enhanceTransactionsBatchOptimized(toEnhance, (current, total) => {
      console.log(`Progress: ${current}/${total}`);
    });

    // Update store
    enhanced.forEach(tx => {
      const index = store.transactions.findIndex(t => t.id === tx.id);
      if (index !== -1) store.transactions[index] = tx;
    });

    res.json({
      success: true,
      enhanced: enhanced.length,
      transactions: enhanced,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get transactions with smart filtering
 */
router.get('/transactions', (req, res) => {
  try {
    let filtered = [...store.transactions];

    // Date range filter
    if (req.query.startDate) filtered = filtered.filter(t => t.date >= (req.query.startDate as string));
    if (req.query.endDate) filtered = filtered.filter(t => t.date <= (req.query.endDate as string));

    // Category filter
    if (req.query.primaryCategory) {
      filtered = filtered.filter(t => t.transaction_primary === req.query.primaryCategory);
    }

    // Search across all text fields
    if (req.query.search) {
      const search = (req.query.search as string).toLowerCase();
      filtered = filtered.filter(
        t =>
          t.transaction_text.toLowerCase().includes(search) ||
          t.transaction_description?.toLowerCase().includes(search)
      );
    }

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const start = (page - 1) * limit;

    res.json({
      transactions: filtered.slice(start, start + limit),
      total: filtered.length,
      page,
      totalPages: Math.ceil(filtered.length / limit),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update transaction
 */
router.patch('/transactions/:id', (req, res) => {
  try {
    const transaction = store.transactions.find(t => t.id === req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Validate Plaid categories if provided
    const { transaction_primary, transaction_detailed } = req.body;
    if (transaction_primary && transaction_detailed) {
      if (!isValidPlaidCategory(transaction_primary, transaction_detailed)) {
        return res.status(400).json({ error: 'Invalid Plaid category' });
      }
    }

    Object.assign(transaction, req.body);
    res.json({ success: true, transaction });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Category endpoints
 */
router.get('/categories', (req, res) => {
  res.json({
    categories: getPlaidCategories(),
    primaryCategories: getPrimaryCategories(),
  });
});

router.get('/categories/:primary', (req, res) => {
  res.json({
    detailedCategories: getDetailedCategories(req.params.primary),
  });
});

/**
 * Generate insights
 */
router.get('/insights', (req, res) => {
  try {
    if (!store.transactions.length) {
      return res.status(400).json({ error: 'No transactions available' });
    }
    res.json(generateInsights(store.transactions));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Export as CSV
 */
router.get('/export/csv', (req, res) => {
  try {
    const headers = [
      'Date',
      'Transaction Text',
      'Payment In',
      'Payment Out',
      'Balance',
      'Description',
      'Primary Category',
      'Detailed Category',
    ];

    const rows = store.transactions.map(t => [
      t.date,
      t.transaction_text,
      t.payment_in,
      t.payment_out,
      t.balance || '',
      t.transaction_description || '',
      t.transaction_primary || '',
      t.transaction_detailed || '',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Clear data (testing)
 */
router.delete('/transactions', (req, res) => {
  store.transactions = [];
  store.statements = [];
  res.json({ success: true, message: 'All data cleared' });
});

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    openai: !!process.env.OPENAI_API_KEY,
  });
});

export default router;
