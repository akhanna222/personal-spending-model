import express from 'express';
import { parseStatementVision } from '../utils/parser.vision';
import {
  enhanceTransactionsBatchVision,
  getPlaidCategories,
  getPrimaryCategories,
  getDetailedCategories,
  isValidPlaidCategory,
} from '../services/openaiService.vision';
import { generateInsights } from '../services/behavioralModel';
import { Transaction } from '../types';
import riskRoutes from './risks';

const router = express.Router();

// In-memory storage
const store = {
  transactions: [] as Transaction[],
  statements: [] as any[],
};

/**
 * VISION-POWERED UPLOAD
 * Zero regex - AI extracts everything
 */
router.post('/upload', async (req, res) => {
  try {
    if (!req.files?.statements) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = Array.isArray(req.files.statements)
      ? req.files.statements
      : [req.files.statements];

    console.log(`Processing ${files.length} file(s) with Vision API`);

    // Process files in parallel
    const results = await Promise.allSettled(
      files.map(async (file) => {
        const startTime = Date.now();
        console.log(`Starting: ${file.name}`);

        const parsed = await parseStatementVision(file.data, file.name);

        const duration = Date.now() - startTime;
        console.log(`Completed: ${file.name} in ${duration}ms (${parsed.transactions.length} txns)`);

        // Add to store
        store.transactions.push(...parsed.transactions);
        store.statements.push({
          id: file.name,
          fileName: file.name,
          uploadDate: new Date().toISOString(),
          transactionCount: parsed.transactions.length,
          processingTime: duration,
          ...parsed.metadata,
        });

        return {
          fileName: file.name,
          success: true,
          transactionCount: parsed.transactions.length,
          processingTime: duration,
          dateRange: parsed.metadata.dateRange,
          categorized: parsed.transactions.filter(
            t => t.transaction_primary && t.transaction_detailed
          ).length,
        };
      })
    );

    const successes = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const failures = results
      .filter(r => r.status === 'rejected')
      .map((r, i) => ({
        fileName: files[i].name,
        error: r.reason?.message || 'Processing failed',
      }));

    res.json({
      success: true,
      results: [...successes, ...failures],
      totalTransactions: store.transactions.length,
      summary: {
        successful: successes.length,
        failed: failures.length,
        totalProcessingTime: successes.reduce((sum, r) => sum + (r.processingTime || 0), 0),
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Optional enhancement for CSV transactions (already extracted)
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

    console.log(`Enhancing ${toEnhance.length} transactions`);

    const enhanced = await enhanceTransactionsBatchVision(toEnhance, (current, total) => {
      console.log(`Enhanced: ${current}/${total}`);
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
    console.error('Enhancement error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get transactions
 */
router.get('/transactions', (req, res) => {
  try {
    let filtered = [...store.transactions];

    // Filters
    if (req.query.startDate) filtered = filtered.filter(t => t.date >= req.query.startDate);
    if (req.query.endDate) filtered = filtered.filter(t => t.date <= req.query.endDate);
    if (req.query.primaryCategory) {
      filtered = filtered.filter(t => t.transaction_primary === req.query.primaryCategory);
    }

    // Search
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
    const tx = store.transactions.find(t => t.id === req.params.id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    const { transaction_primary, transaction_detailed } = req.body;
    if (transaction_primary && transaction_detailed) {
      if (!isValidPlaidCategory(transaction_primary, transaction_detailed)) {
        return res.status(400).json({ error: 'Invalid Plaid category' });
      }
    }

    Object.assign(tx, req.body);
    res.json({ success: true, transaction: tx });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Categories
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
 * Insights
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
 * Export CSV
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
      `"${t.transaction_text.replace(/"/g, '""')}"`, // Escape quotes
      t.payment_in,
      t.payment_out,
      t.balance || '',
      `"${(t.transaction_description || '').replace(/"/g, '""')}"`,
      t.transaction_primary || '',
      t.transaction_detailed || '',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Clear data
 */
router.delete('/transactions', (req, res) => {
  const count = store.transactions.length;
  store.transactions = [];
  store.statements = [];
  res.json({ success: true, message: `Cleared ${count} transactions` });
});

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: 'vision',
    openai: !!process.env.OPENAI_API_KEY,
    stats: {
      transactions: store.transactions.length,
      statements: store.statements.length,
    },
  });
});

/**
 * Mount risk analysis routes
 */
router.use('/risks', riskRoutes);

export default router;
