import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface BankStatement {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  upload_date: Date;
  total_transactions: number;
  date_range_start?: Date;
  date_range_end?: Date;
  metadata?: any;
}

export class StatementService {
  /**
   * Create a new bank statement record
   */
  async createStatement(
    userId: string,
    fileName: string,
    fileType: string,
    totalTransactions: number,
    dateRangeStart?: Date,
    dateRangeEnd?: Date,
    metadata?: any
  ): Promise<BankStatement> {
    const result = await pool.query(
      `INSERT INTO bank_statements
       (user_id, file_name, file_type, total_transactions, date_range_start, date_range_end, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, fileName, fileType, totalTransactions, dateRangeStart, dateRangeEnd, metadata]
    );

    return result.rows[0];
  }

  /**
   * Get all statements for a user
   */
  async getUserStatements(userId: string, limit = 50, offset = 0): Promise<{
    statements: BankStatement[];
    total: number;
  }> {
    const [statementsResult, countResult] = await Promise.all([
      pool.query(
        `SELECT * FROM bank_statements
         WHERE user_id = $1
         ORDER BY upload_date DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      ),
      pool.query(
        'SELECT COUNT(*) FROM bank_statements WHERE user_id = $1',
        [userId]
      ),
    ]);

    return {
      statements: statementsResult.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  /**
   * Get a single statement by ID
   */
  async getStatementById(statementId: string, userId: string): Promise<BankStatement | null> {
    const result = await pool.query(
      `SELECT * FROM bank_statements
       WHERE id = $1 AND user_id = $2`,
      [statementId, userId]
    );

    return result.rows[0] || null;
  }

  /**
   * Delete a statement
   */
  async deleteStatement(statementId: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM bank_statements
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [statementId, userId]
    );

    return result.rowCount > 0;
  }

  /**
   * Get statement statistics for a user
   */
  async getStatementStats(userId: string): Promise<{
    totalStatements: number;
    totalTransactions: number;
    earliestDate?: Date;
    latestDate?: Date;
  }> {
    const result = await pool.query(
      `SELECT
         COUNT(*) as total_statements,
         COALESCE(SUM(total_transactions), 0) as total_transactions,
         MIN(date_range_start) as earliest_date,
         MAX(date_range_end) as latest_date
       FROM bank_statements
       WHERE user_id = $1`,
      [userId]
    );

    const row = result.rows[0];
    return {
      totalStatements: parseInt(row.total_statements),
      totalTransactions: parseInt(row.total_transactions),
      earliestDate: row.earliest_date,
      latestDate: row.latest_date,
    };
  }
}

export const statementService = new StatementService();
