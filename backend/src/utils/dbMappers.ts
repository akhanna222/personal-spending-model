/**
 * Database Row Mappers
 * Utility functions to map database rows to TypeScript types
 */

import { RiskPattern } from '../services/behaviorRiskAnalyzer';

/**
 * Database row type for risk patterns
 */
export interface RiskPatternRow {
  id: string;
  user_id: string;
  pattern_type: string;
  pattern_name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  detected_at: string;
  affected_transactions: string;
  timeframe: string;
  amount_involved: string;
  recommendation: string;
  is_dismissed?: boolean;
  dismissed_at?: string;
}

/**
 * Map database row to RiskPattern object
 */
export function mapRowToRiskPattern(row: RiskPatternRow): RiskPattern {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.pattern_type as RiskPattern['type'],
    severity: row.severity,
    title: row.pattern_name,
    description: row.description,
    confidence: row.confidence,
    detectedAt: row.detected_at,
    pattern: {
      timeframe: row.timeframe,
      transactions: safeJsonParse(row.affected_transactions, []),
      indicators: [],
      context: row.description,
    },
    userFeedback: undefined,
    version: 1,
    learningScore: 0.5,
    recommendations: row.recommendation ? row.recommendation.split('; ').filter(Boolean) : [],
  };
}

/**
 * Safely parse JSON with fallback
 */
export function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Database row type for pattern templates
 */
export interface PatternTemplateRow {
  pattern_type: string;
  display_name: string;
  description: string;
  severity: string;
  learning_score: string;
  total_detections: number;
  accurate_feedbacks: number;
  success_rate: string;
}

/**
 * Map database row to pattern template
 */
export function mapRowToPatternTemplate(row: PatternTemplateRow) {
  return {
    patternType: row.pattern_type,
    displayName: row.display_name,
    description: row.description,
    severity: row.severity,
    learningScore: parseFloat(row.learning_score),
    totalDetections: row.total_detections,
    accurateFeedbacks: row.accurate_feedbacks,
    successRate: parseFloat(row.success_rate),
  };
}

/**
 * Build dynamic SQL UPDATE query
 */
export function buildUpdateQuery(
  table: string,
  updates: Record<string, any>,
  whereParams: any[]
): { query: string; values: any[]; hasUpdates: boolean } {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  }

  if (fields.length === 0) {
    return { query: '', values: [], hasUpdates: false };
  }

  // Add WHERE parameters
  const wherePlaceholders = whereParams.map((_, idx) => `$${paramCount + idx}`).join(' AND ');
  values.push(...whereParams);

  const query = `
    UPDATE ${table}
    SET ${fields.join(', ')}
    WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
    RETURNING *
  `;

  return { query, values, hasUpdates: true };
}

/**
 * Safe number conversion with default
 */
export function safeParseFloat(value: string | number | null | undefined, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Safe integer conversion with default
 */
export function safeParseInt(value: string | number | null | undefined, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;
  const parsed = typeof value === 'string' ? parseInt(value, 10) : value;
  return isNaN(parsed) ? defaultValue : parsed;
}
