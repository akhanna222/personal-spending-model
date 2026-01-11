import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { riskService } from '../services/riskService';
import { transactionService } from '../services/transactionService';

const router = Router();

/**
 * POST /api/risks/analyze
 * Analyze transactions for risk patterns
 */
router.post('/analyze', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { transactions } = req.body;

    // If no transactions provided, get from database
    let txnsToAnalyze = transactions;

    if (!txnsToAnalyze || !Array.isArray(txnsToAnalyze)) {
      const result = await transactionService.getUserTransactions(req.user!.id, {
        limit: 10000,
      });
      txnsToAnalyze = result.transactions;
    }

    if (txnsToAnalyze.length === 0) {
      res.status(400).json({ error: 'No transactions to analyze' });
      return;
    }

    console.log(`Analyzing risks for user ${req.user!.id} with ${txnsToAnalyze.length} transactions`);

    // Analyze risks
    const detectedPatterns = await riskService.analyzeRisks(req.user!.id, txnsToAnalyze);

    // Group by severity
    const bySeverity = {
      critical: detectedPatterns.filter((p) => p.severity === 'critical'),
      high: detectedPatterns.filter((p) => p.severity === 'high'),
      medium: detectedPatterns.filter((p) => p.severity === 'medium'),
      low: detectedPatterns.filter((p) => p.severity === 'low'),
    };

    res.json({
      success: true,
      userId: req.user!.id,
      patternsDetected: detectedPatterns.length,
      patterns: detectedPatterns,
      summary: {
        critical: bySeverity.critical.length,
        high: bySeverity.high.length,
        medium: bySeverity.medium.length,
        low: bySeverity.low.length,
      },
    });
  } catch (error: any) {
    console.error('Risk analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/risks/patterns
 * Get all risk patterns for authenticated user
 */
router.get('/patterns', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const onlyActive = req.query.onlyActive !== 'false';

    const patterns = await riskService.getUserPatterns(req.user!.id, onlyActive);

    // Sort by severity and confidence
    const sorted = patterns.sort((a, b) => {
      const severityOrder: { [key: string]: number } = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.confidence - a.confidence;
    });

    res.json({
      userId: req.user!.id,
      patterns: sorted,
      total: sorted.length,
    });
  } catch (error: any) {
    console.error('Get patterns error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/risks/patterns/:patternId
 * Get a single risk pattern
 */
router.get('/patterns/:patternId', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pattern = await riskService.getPatternById(req.params.patternId, req.user!.id);

    if (!pattern) {
      res.status(404).json({ error: 'Pattern not found' });
      return;
    }

    res.json({ pattern });
  } catch (error: any) {
    console.error('Get pattern error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/risks/patterns/:patternId
 * Update a risk pattern (edit description, recommendation, severity)
 */
router.patch('/patterns/:patternId', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { description, recommendation, severity } = req.body;

    const updated = await riskService.updatePattern(req.params.patternId, req.user!.id, {
      description,
      recommendation,
      severity,
    });

    if (!updated) {
      res.status(404).json({ error: 'Pattern not found or no changes made' });
      return;
    }

    res.json({
      success: true,
      message: 'Pattern updated successfully',
      pattern: updated,
    });
  } catch (error: any) {
    console.error('Update pattern error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/risks/patterns/:patternId
 * Dismiss a pattern
 */
router.delete('/patterns/:patternId', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const dismissed = await riskService.dismissPattern(req.params.patternId, req.user!.id);

    if (!dismissed) {
      res.status(404).json({ error: 'Pattern not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Pattern dismissed successfully',
    });
  } catch (error: any) {
    console.error('Dismiss pattern error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/risks/feedback
 * Submit feedback on a risk pattern
 */
router.post('/feedback', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patternId, isAccurate, isRelevant, isActionable, notes } = req.body;

    if (!patternId) {
      res.status(400).json({ error: 'patternId required' });
      return;
    }

    if (typeof isAccurate !== 'boolean' || typeof isRelevant !== 'boolean') {
      res.status(400).json({ error: 'isAccurate and isRelevant must be boolean' });
      return;
    }

    console.log(`Recording feedback for pattern ${patternId} from user ${req.user!.id}`);

    await riskService.submitFeedback(req.user!.id, patternId, {
      isAccurate,
      isRelevant,
      isActionable: isActionable !== undefined ? isActionable : true,
      notes,
    });

    res.json({
      success: true,
      message: 'Feedback recorded successfully. The system will learn from your input!',
    });
  } catch (error: any) {
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      console.error('Feedback error:', error);
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * GET /api/risks/stats
 * Get risk statistics for authenticated user
 */
router.get('/stats', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await riskService.getRiskStats(req.user!.id);

    res.json({
      userId: req.user!.id,
      stats,
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/risks/templates
 * Get all pattern templates with learning scores
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = await riskService.getPatternTemplates();

    res.json({
      templates,
      total: templates.length,
    });
  } catch (error: any) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
