import { pool } from '../config/database';
import { riskAnalyzer, RiskPattern, PatternFeedback } from './behaviorRiskAnalyzer';
import { Transaction } from '../types';

export class RiskService {
  /**
   * Analyze risks for a user
   */
  async analyzeRisks(
    userId: string,
    transactions: Transaction[]
  ): Promise<RiskPattern[]> {
    // Get historical patterns for learning context
    const historicalPatterns = await this.getUserPatterns(userId);

    // Analyze with AI
    const detectedPatterns = await riskAnalyzer.analyzeRisks(
      userId,
      transactions,
      historicalPatterns
    );

    // Store patterns in database
    for (const pattern of detectedPatterns) {
      await this.savePattern(userId, pattern);
    }

    return detectedPatterns;
  }

  /**
   * Save a detected risk pattern
   */
  async savePattern(userId: string, pattern: RiskPattern): Promise<void> {
    await pool.query(
      `INSERT INTO user_risk_patterns
       (id, user_id, pattern_type, pattern_name, description, severity, confidence,
        affected_transactions, timeframe, amount_involved, recommendation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET
         description = EXCLUDED.description,
         confidence = EXCLUDED.confidence,
         affected_transactions = EXCLUDED.affected_transactions`,
      [
        pattern.id,
        userId,
        pattern.patternType,
        pattern.patternName,
        pattern.description,
        pattern.severity,
        pattern.confidence,
        JSON.stringify(pattern.affectedTransactions),
        pattern.timeframe,
        pattern.amountInvolved,
        pattern.recommendation,
      ]
    );
  }

  /**
   * Get all patterns for a user
   */
  async getUserPatterns(
    userId: string,
    onlyActive = true
  ): Promise<RiskPattern[]> {
    const query = `
      SELECT * FROM user_risk_patterns
      WHERE user_id = $1 ${onlyActive ? 'AND is_dismissed = false' : ''}
      ORDER BY detected_at DESC
    `;

    const result = await pool.query(query, [userId]);

    return result.rows.map((row) => ({
      id: row.id,
      patternType: row.pattern_type,
      patternName: row.pattern_name,
      description: row.description,
      severity: row.severity,
      confidence: row.confidence,
      detectedAt: row.detected_at,
      affectedTransactions: row.affected_transactions,
      timeframe: row.timeframe,
      amountInvolved: parseFloat(row.amount_involved),
      recommendation: row.recommendation,
      userFeedback: null, // Will be loaded separately if needed
    }));
  }

  /**
   * Get pattern by ID
   */
  async getPatternById(
    patternId: string,
    userId: string
  ): Promise<RiskPattern | null> {
    const result = await pool.query(
      'SELECT * FROM user_risk_patterns WHERE id = $1 AND user_id = $2',
      [patternId, userId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      patternType: row.pattern_type,
      patternName: row.pattern_name,
      description: row.description,
      severity: row.severity,
      confidence: row.confidence,
      detectedAt: row.detected_at,
      affectedTransactions: row.affected_transactions,
      timeframe: row.timeframe,
      amountInvolved: parseFloat(row.amount_involved),
      recommendation: row.recommendation,
      userFeedback: null,
    };
  }

  /**
   * Submit feedback on a pattern
   */
  async submitFeedback(
    userId: string,
    patternId: string,
    feedback: PatternFeedback
  ): Promise<void> {
    // Get pattern to find template
    const pattern = await this.getPatternById(patternId, userId);

    if (!pattern) {
      throw new Error('Pattern not found');
    }

    // Get template ID if exists
    const templateResult = await pool.query(
      'SELECT id FROM risk_pattern_templates WHERE pattern_type = $1',
      [pattern.patternType]
    );

    const templateId = templateResult.rows[0]?.id || null;

    // Insert feedback
    await pool.query(
      `INSERT INTO risk_pattern_feedback
       (user_id, pattern_id, template_id, is_accurate, is_relevant, is_actionable, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        patternId,
        templateId,
        feedback.isAccurate,
        feedback.isRelevant,
        feedback.isActionable || true,
        feedback.notes,
      ]
    );

    // Update template learning scores
    if (templateId) {
      await riskAnalyzer.recordFeedback(userId, patternId, feedback);

      // Update database template
      const template = riskAnalyzer
        .getPatternTemplates()
        .find((t) => t.patternType === pattern.patternType);

      if (template) {
        await pool.query(
          `UPDATE risk_pattern_templates
           SET learning_score = $1,
               total_detections = $2,
               accurate_feedbacks = $3,
               success_rate = $4,
               updated_at = CURRENT_TIMESTAMP
           WHERE pattern_type = $5`,
          [
            template.learningScore,
            template.totalDetections,
            template.accurateFeedbacks,
            template.successRate,
            template.patternType,
          ]
        );
      }
    }
  }

  /**
   * Get pattern templates
   */
  async getPatternTemplates(): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM risk_pattern_templates
       WHERE is_active = true
       ORDER BY success_rate DESC, learning_score DESC`
    );

    return result.rows.map((row) => ({
      patternType: row.pattern_type,
      displayName: row.display_name,
      description: row.description,
      severity: row.severity,
      learningScore: parseFloat(row.learning_score),
      totalDetections: row.total_detections,
      accurateFeedbacks: row.accurate_feedbacks,
      successRate: parseFloat(row.success_rate),
    }));
  }

  /**
   * Get risk statistics for a user
   */
  async getRiskStats(userId: string): Promise<{
    totalPatterns: number;
    bySeverity: { [key: string]: number };
    withFeedback: number;
    averageConfidence: number;
  }> {
    const result = await pool.query(
      `SELECT
         COUNT(*) as total_patterns,
         COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical,
         COUNT(CASE WHEN severity = 'high' THEN 1 END) as high,
         COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium,
         COUNT(CASE WHEN severity = 'low' THEN 1 END) as low,
         AVG(confidence) as avg_confidence
       FROM user_risk_patterns
       WHERE user_id = $1 AND is_dismissed = false`,
      [userId]
    );

    const feedbackResult = await pool.query(
      `SELECT COUNT(DISTINCT pattern_id) as with_feedback
       FROM risk_pattern_feedback
       WHERE user_id = $1`,
      [userId]
    );

    const row = result.rows[0];
    return {
      totalPatterns: parseInt(row.total_patterns),
      bySeverity: {
        critical: parseInt(row.critical),
        high: parseInt(row.high),
        medium: parseInt(row.medium),
        low: parseInt(row.low),
      },
      withFeedback: parseInt(feedbackResult.rows[0].with_feedback),
      averageConfidence: parseFloat(row.avg_confidence) || 0,
    };
  }

  /**
   * Dismiss a pattern
   */
  async dismissPattern(patternId: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE user_risk_patterns
       SET is_dismissed = true, dismissed_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [patternId, userId]
    );

    return result.rowCount > 0;
  }

  /**
   * Update pattern (for editing)
   */
  async updatePattern(
    patternId: string,
    userId: string,
    updates: {
      description?: string;
      recommendation?: string;
      severity?: string;
    }
  ): Promise<RiskPattern | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount}`);
      values.push(updates.description);
      paramCount++;
    }

    if (updates.recommendation !== undefined) {
      fields.push(`recommendation = $${paramCount}`);
      values.push(updates.recommendation);
      paramCount++;
    }

    if (updates.severity !== undefined) {
      fields.push(`severity = $${paramCount}`);
      values.push(updates.severity);
      paramCount++;
    }

    if (fields.length === 0) return null;

    values.push(patternId, userId);

    const query = `
      UPDATE user_risk_patterns
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      patternType: row.pattern_type,
      patternName: row.pattern_name,
      description: row.description,
      severity: row.severity,
      confidence: row.confidence,
      detectedAt: row.detected_at,
      affectedTransactions: row.affected_transactions,
      timeframe: row.timeframe,
      amountInvolved: parseFloat(row.amount_involved),
      recommendation: row.recommendation,
      userFeedback: null,
    };
  }
}

export const riskService = new RiskService();
