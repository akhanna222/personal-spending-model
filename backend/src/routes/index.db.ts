import express, { Response } from 'express';
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
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { statementService } from '../services/statementService';
import { transactionService } from '../services/transactionService';
import authRoutes from './auth';
import statementRoutes from './statements';
import riskRoutes from './risks';

const router = express.Router();

/**
 * Mount auth routes (no auth required)
 */
router.use('/auth', authRoutes);

/**
 * Mount statement routes (auth required)
 */
router.use('/statements', statementRoutes);

/**
 * VISION-POWERED UPLOAD with PostgreSQL
 * Zero regex - AI extracts everything
 */
router.post('/upload', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.files?.statements) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    const files = Array.isArray(req.files.statements)
      ? req.files.statements
      : [req.files.statements];

    console.log(`Processing ${files.length} file(s) with Vision API for user ${req.user!.id}`);

    // Process files in parallel
    const results = await Promise.allSettled(
      files.map(async (file) => {
        const startTime = Date.now();
        console.log(`Starting: ${file.name}`);

        const parsed = await parseStatementVision(file.data, file.name);

        const duration = Date.now() - startTime;
        console.log(`Completed: ${file.name} in ${duration}ms (${parsed.transactions.length} txns)`);

        // Create statement record
        const statement = await statementService.createStatement(
          req.user!.id,
          file.name,
          file.mimetype || 'application/octet-stream',
          parsed.transactions.length,
          parsed.metadata.dateRange?.start
            ? new Date(parsed.metadata.dateRange.start)
            : undefined,
          parsed.metadata.dateRange?.end ? new Date(parsed.metadata.dateRange.end) : undefined,
          {
            processingTime: duration,
            ...parsed.metadata,
          }
        );

        // Insert transactions
        if (parsed.transactions.length > 0) {
          await transactionService.createTransactions(
            req.user!.id,
            statement.id,
            parsed.transactions
          );
        }

        return {
          fileName: file.name,
          success: true,
          transactionCount: parsed.transactions.length,
          processingTime: duration,
          dateRange: parsed.metadata.dateRange,
          categorized: parsed.transactions.filter(
            (t) => t.transaction_primary && t.transaction_detailed
          ).length,
        };
      })
    );

    const successes = results.filter((r) => r.status === 'fulfilled').map((r: any) => r.value);
    const failures = results
      .filter((r) => r.status === 'rejected')
      .map((r: any, i) => ({
        fileName: files[i].name,
        error: r.reason?.message || 'Processing failed',
      }));

    // Get updated stats
    const stats = await transactionService.getTransactionStats(req.user!.id);

    res.json({
      success: true,
      results: [...successes, ...failures],
      totalTransactions: stats.totalTransactions,
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
router.post(
  '/transactions/enhance',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { transactionIds } = req.body;

      if (!transactionIds?.length) {
        res.status(400).json({ error: 'transactionIds array required' });
        return;
      }

      // Get transactions from database
      const allTransactions = await transactionService.getUserTransactions(req.user!.id, {
        limit: 10000,
      });

      const toEnhance = allTransactions.transactions.filter((t) =>
        transactionIds.includes(t.id)
      );

      if (!toEnhance.length) {
        res.status(404).json({ error: 'No matching transactions' });
        return;
      }

      console.log(`Enhancing ${toEnhance.length} transactions`);

      const enhanced = await enhanceTransactionsBatchVision(toEnhance, (current, total) => {
        console.log(`Enhanced: ${current}/${total}`);
      });

      // Update database
      for (const tx of enhanced) {
        await transactionService.updateTransaction(tx.id, req.user!.id, {
          transaction_description: tx.transaction_description,
          transaction_primary: tx.transaction_primary,
          transaction_detailed: tx.transaction_detailed,
        });
      }

      res.json({
        success: true,
        enhanced: enhanced.length,
        transactions: enhanced,
      });
    } catch (error: any) {
      console.error('Enhancement error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Get transactions
 */
router.get(
  '/transactions',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const result = await transactionService.getUserTransactions(req.user!.id, {
        limit,
        offset,
        search: req.query.search as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        category: req.query.primaryCategory as string,
      });

      res.json({
        transactions: result.transactions,
        total: result.total,
        page,
        totalPages: Math.ceil(result.total / limit),
      });
    } catch (error: any) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Update transaction
 */
router.patch(
  '/transactions/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { transaction_primary, transaction_detailed, transaction_description, is_reviewed } =
        req.body;

      if (transaction_primary && transaction_detailed) {
        if (!isValidPlaidCategory(transaction_primary, transaction_detailed)) {
          res.status(400).json({ error: 'Invalid Plaid category' });
          return;
        }
      }

      const updated = await transactionService.updateTransaction(
        req.params.id,
        req.user!.id,
        {
          transaction_primary,
          transaction_detailed,
          transaction_description,
          is_reviewed,
        }
      );

      res.json({ success: true, transaction: updated });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        console.error('Update transaction error:', error);
        res.status(500).json({ error: error.message });
      }
    }
  }
);

/**
 * Categories (no auth required - public data)
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
router.get(
  '/insights',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await transactionService.getUserTransactions(req.user!.id, {
        limit: 10000,
      });

      if (!result.transactions.length) {
        res.status(400).json({ error: 'No transactions available' });
        return;
      }

      const insights = generateInsights(result.transactions);
      res.json(insights);
    } catch (error: any) {
      console.error('Insights error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Export CSV
 */
router.get(
  '/export/csv',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await transactionService.getUserTransactions(req.user!.id, {
        limit: 100000,
      });

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

      const rows = result.transactions.map((t) => [
        t.date,
        `"${t.transaction_text.replace(/"/g, '""')}"`,
        t.payment_in,
        t.payment_out,
        t.balance || '',
        `"${(t.transaction_description || '').replace(/"/g, '""')}"`,
        t.transaction_primary || '',
        t.transaction_detailed || '',
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
      res.send(csv);
    } catch (error: any) {
      console.error('Export CSV error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Clear data (for testing)
 */
router.delete(
  '/transactions',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const count = await transactionService.deleteAllUserTransactions(req.user!.id);
      res.json({ success: true, message: `Cleared ${count} transactions` });
    } catch (error: any) {
      console.error('Clear transactions error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Health check
 */
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    const { pool } = require('../config/database');
    await pool.query('SELECT 1');

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      mode: 'vision-database',
      openai: !!process.env.OPENAI_API_KEY,
      database: 'connected',
      jwt: !!process.env.JWT_SECRET,
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed',
    });
  }
});

/**
 * Mount risk analysis routes (auth required)
 */
router.use('/risks', riskRoutes);

export default router;
