import express from 'express';
import fileUpload from 'express-fileupload';
import { parseCSV, parsePDF, parseImage } from '../utils/parser';
import {
  enhanceTransactionWithOpenAI,
  enhanceTransactionsBatch,
  getPlaidCategories,
  getPrimaryCategories,
  getDetailedCategories,
  isValidPlaidCategory,
} from '../services/openaiService';
import { generateInsights } from '../services/behavioralModel';
import { Transaction } from '../types';

const router = express.Router();

// In-memory storage (in production, use a database)
let transactions: Transaction[] = [];
let uploadedStatements: any[] = [];

/**
 * POST /api/upload
 * Upload and parse bank statements
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
      const lowerFileName = fileName.toLowerCase();

      // Determine file type
      let fileType: 'pdf' | 'csv' | 'image' = 'csv';
      if (lowerFileName.endsWith('.pdf')) {
        fileType = 'pdf';
      } else if (lowerFileName.match(/\.(png|jpg|jpeg|gif|bmp|tiff)$/)) {
        fileType = 'image';
      } else if (!lowerFileName.endsWith('.csv')) {
        results.push({ fileName, error: 'Unsupported file type. Supported: PDF, CSV, PNG, JPG, JPEG' });
        continue;
      }

      let parsed;
      try {
        if (fileType === 'pdf') {
          parsed = await parsePDF(fileBuffer, fileName);
        } else if (fileType === 'csv') {
          parsed = await parseCSV(fileBuffer, fileName);
        } else if (fileType === 'image') {
          parsed = await parseImage(fileBuffer, fileName);
        } else {
          results.push({ fileName, error: 'Unsupported file type' });
          continue;
        }
      } catch (parseError: any) {
        console.error(`Error parsing ${fileName}:`, parseError);
        results.push({ fileName, error: `Parsing failed: ${parseError.message}` });
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
      filtered = filtered.filter(t => t.date >= req.query.startDate);
    }
    if (req.query.endDate) {
      filtered = filtered.filter(t => t.date <= req.query.endDate);
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
 * Enhance transactions with OpenAI (generate descriptions and match Plaid categories)
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
    const enhanced = await enhanceTransactionsBatch(toEnhance, (current, total) => {
      // Could emit progress via WebSocket in production
      console.log(`Enhanced ${current}/${total} transactions`);
    });

    // Update transactions in the store
    enhanced.forEach(enhancedTx => {
      const index = transactions.findIndex(t => t.id === enhancedTx.id);
      if (index !== -1) {
        transactions[index] = enhancedTx;
      }
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
    if (updates.transaction_primary && updates.transaction_detailed) {
      if (!isValidPlaidCategory(updates.transaction_primary, updates.transaction_detailed)) {
        return res.status(400).json({ error: 'Invalid Plaid category combination' });
      }
    }
    // Also validate legacy category fields
    if (updates.primaryCategory && updates.detailedCategory) {
      if (!isValidPlaidCategory(updates.primaryCategory, updates.detailedCategory)) {
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
 * Get all available Plaid categories
 */
router.get('/categories', (req, res) => {
  try {
    res.json({
      categories: getPlaidCategories(),
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
 * DELETE /api/transactions
 * Clear all transactions (for testing/demo)
 */
router.delete('/transactions', (req, res) => {
  transactions = [];
  uploadedStatements = [];
  res.json({ success: true, message: 'All data cleared' });
});

export default router;
