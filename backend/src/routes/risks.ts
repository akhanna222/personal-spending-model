import express from 'express';
import { riskAnalyzer, RiskPattern } from '../services/behaviorRiskAnalyzer';
import { Transaction } from '../types';

const router = express.Router();

// In-memory storage (replace with database in production)
const userTransactions = new Map<string, Transaction[]>();
const userRiskPatterns = new Map<string, RiskPattern[]>();

/**
 * POST /api/risks/analyze
 * Analyze transactions for risk patterns
 */
router.post('/analyze', async (req, res) => {
  try {
    const { userId, transactions } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'transactions array required' });
    }

    console.log(`Analyzing risks for user ${userId} with ${transactions.length} transactions`);

    // Store transactions
    userTransactions.set(userId, transactions);

    // Get historical patterns for this user
    const historicalPatterns = userRiskPatterns.get(userId) || [];

    // Analyze risks
    const detectedPatterns = await riskAnalyzer.analyzeRisks(
      userId,
      transactions,
      historicalPatterns
    );

    // Store detected patterns
    userRiskPatterns.set(userId, [...historicalPatterns, ...detectedPatterns]);

    // Group by severity
    const bySeverity = {
      critical: detectedPatterns.filter(p => p.severity === 'critical'),
      high: detectedPatterns.filter(p => p.severity === 'high'),
      medium: detectedPatterns.filter(p => p.severity === 'medium'),
      low: detectedPatterns.filter(p => p.severity === 'low'),
    };

    res.json({
      success: true,
      userId,
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
 * GET /api/risks/patterns/:userId
 * Get all risk patterns for a user
 */
router.get('/patterns/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { withFeedback } = req.query;

    const patterns = riskAnalyzer.getUserPatterns(
      userId,
      withFeedback !== 'true'
    );

    // Filter patterns for this user from storage
    const userPatterns = (userRiskPatterns.get(userId) || []).filter(p => {
      if (withFeedback === 'true') {
        return p.userFeedback !== undefined;
      }
      return true;
    });

    // Sort by severity and confidence
    const sorted = userPatterns.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.confidence - a.confidence;
    });

    res.json({
      userId,
      patterns: sorted,
      total: sorted.length,
      pendingFeedback: sorted.filter(p => !p.userFeedback).length,
    });
  } catch (error: any) {
    console.error('Get patterns error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/risks/feedback
 * Submit feedback on a risk pattern
 */
router.post('/feedback', async (req, res) => {
  try {
    const { userId, patternId, isAccurate, isRelevant, notes } = req.body;

    if (!userId || !patternId) {
      return res.status(400).json({ error: 'userId and patternId required' });
    }

    if (typeof isAccurate !== 'boolean' || typeof isRelevant !== 'boolean') {
      return res.status(400).json({ error: 'isAccurate and isRelevant must be boolean' });
    }

    console.log(`Recording feedback for pattern ${patternId} from user ${userId}`);

    // Record feedback
    await riskAnalyzer.recordFeedback(userId, patternId, {
      isAccurate,
      isRelevant,
      notes,
    });

    // Update stored pattern
    const userPatterns = userRiskPatterns.get(userId) || [];
    const pattern = userPatterns.find(p => p.id === patternId);

    if (pattern) {
      pattern.userFeedback = {
        isAccurate,
        isRelevant,
        notes,
        submittedAt: new Date().toISOString(),
      };
    }

    res.json({
      success: true,
      message: 'Feedback recorded',
      pattern,
    });
  } catch (error: any) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/risks/evolve/:userId
 * Evolve pattern detection based on user feedback
 */
router.post('/evolve/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`Evolving patterns for user ${userId}`);

    const templates = await riskAnalyzer.evolvePatterns(userId);

    res.json({
      success: true,
      message: 'Patterns evolved based on your feedback',
      templates: templates.map(t => ({
        name: t.name,
        type: t.type,
        successRate: t.successRate,
        learningScore: t.learningScore,
        totalDetections: t.totalDetections,
      })),
    });
  } catch (error: any) {
    console.error('Pattern evolution error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/risks/templates
 * Get all pattern templates (for analytics)
 */
router.get('/templates', (req, res) => {
  try {
    const templates = riskAnalyzer.getPatternTemplates();

    res.json({
      templates: templates.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        type: t.type,
        severity: t.severity,
        successRate: t.successRate,
        learningScore: t.learningScore,
        totalDetections: t.totalDetections,
        accurateFeedbacks: t.accurateFeedbacks,
      })),
    });
  } catch (error: any) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/risks/pattern/:userId/:patternId
 * Dismiss a pattern
 */
router.delete('/pattern/:userId/:patternId', (req, res) => {
  try {
    const { userId, patternId } = req.params;

    const userPatterns = userRiskPatterns.get(userId) || [];
    const filtered = userPatterns.filter(p => p.id !== patternId);

    userRiskPatterns.set(userId, filtered);

    res.json({
      success: true,
      message: 'Pattern dismissed',
    });
  } catch (error: any) {
    console.error('Delete pattern error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/risks/stats/:userId
 * Get risk statistics for a user
 */
router.get('/stats/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const patterns = userRiskPatterns.get(userId) || [];

    const stats = {
      totalPatterns: patterns.length,
      bySeverity: {
        critical: patterns.filter(p => p.severity === 'critical').length,
        high: patterns.filter(p => p.severity === 'high').length,
        medium: patterns.filter(p => p.severity === 'medium').length,
        low: patterns.filter(p => p.severity === 'low').length,
      },
      withFeedback: patterns.filter(p => p.userFeedback).length,
      accurateDetections: patterns.filter(p => p.userFeedback?.isAccurate).length,
      avgConfidence: patterns.length > 0
        ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
        : 0,
      byType: patterns.reduce((acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    res.json(stats);
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
