import { pool } from '../config/database';
import { Transaction } from '../types';

export class TransactionService {
  /**
   * Create multiple transactions
   */
  async createTransactions(
    userId: string,
    statementId: string,
    transactions: Omit<Transaction, 'id'>[]
  ): Promise<Transaction[]> {
    if (transactions.length === 0) return [];

    // Build bulk insert query
    const values: any[] = [];
    const placeholders: string[] = [];
    let paramCount = 1;

    transactions.forEach((txn, idx) => {
      const placeholder = `($${paramCount}, $${paramCount + 1}, $${paramCount + 2}, $${paramCount + 3}, $${paramCount + 4}, $${paramCount + 5}, $${paramCount + 6}, $${paramCount + 7}, $${paramCount + 8}, $${paramCount + 9})`;
      placeholders.push(placeholder);

      values.push(
        userId,
        statementId,
        txn.date,
        txn.transaction_text,
        txn.payment_in || 0,
        txn.payment_out || 0,
        txn.balance || null,
        txn.transaction_description || null,
        txn.transaction_primary || null,
        txn.transaction_detailed || null
      );

      paramCount += 10;
    });

    const query = `
      INSERT INTO transactions
      (user_id, statement_id, date, transaction_text, payment_in, payment_out, balance, transaction_description, transaction_primary, transaction_detailed)
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Get all transactions for a user
   */
  async getUserTransactions(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      search?: string;
      startDate?: string;
      endDate?: string;
      category?: string;
    } = {}
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const { limit = 50, offset = 0, search, startDate, endDate, category } = options;

    let whereConditions = ['user_id = $1'];
    const params: any[] = [userId];
    let paramCount = 2;

    if (search) {
      whereConditions.push(`(transaction_text ILIKE $${paramCount} OR transaction_description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (startDate) {
      whereConditions.push(`date >= $${paramCount}`);
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      whereConditions.push(`date <= $${paramCount}`);
      params.push(endDate);
      paramCount++;
    }

    if (category) {
      whereConditions.push(`(transaction_primary = $${paramCount} OR transaction_detailed = $${paramCount})`);
      params.push(category);
      paramCount++;
    }

    const whereClause = whereConditions.join(' AND ');

    const [transactionsResult, countResult] = await Promise.all([
      pool.query(
        `SELECT * FROM transactions
         WHERE ${whereClause}
         ORDER BY date DESC, created_at DESC
         LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        [...params, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*) FROM transactions WHERE ${whereClause}`,
        params
      ),
    ]);

    return {
      transactions: transactionsResult.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(transactionId: string, userId: string): Promise<Transaction | null> {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [transactionId, userId]
    );

    return result.rows[0] || null;
  }

  /**
   * Update transaction
   */
  async updateTransaction(
    transactionId: string,
    userId: string,
    updates: Partial<Transaction>
  ): Promise<Transaction> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    const allowedFields = [
      'transaction_description',
      'transaction_primary',
      'transaction_detailed',
      'is_reviewed',
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(transactionId, userId);

    const query = `
      UPDATE transactions
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Transaction not found');
    }

    return result.rows[0];
  }

  /**
   * Delete all transactions for a user (for testing)
   */
  async deleteAllUserTransactions(userId: string): Promise<number> {
    const result = await pool.query(
      'DELETE FROM transactions WHERE user_id = $1',
      [userId]
    );

    return result.rowCount;
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(userId: string): Promise<{
    totalTransactions: number;
    categorizedTransactions: number;
    reviewedTransactions: number;
    totalIncome: number;
    totalExpenses: number;
  }> {
    const result = await pool.query(
      `SELECT
         COUNT(*) as total_transactions,
         COUNT(CASE WHEN transaction_primary IS NOT NULL THEN 1 END) as categorized_transactions,
         COUNT(CASE WHEN is_reviewed = true THEN 1 END) as reviewed_transactions,
         COALESCE(SUM(payment_in), 0) as total_income,
         COALESCE(SUM(payment_out), 0) as total_expenses
       FROM transactions
       WHERE user_id = $1`,
      [userId]
    );

    const row = result.rows[0];
    return {
      totalTransactions: parseInt(row.total_transactions),
      categorizedTransactions: parseInt(row.categorized_transactions),
      reviewedTransactions: parseInt(row.reviewed_transactions),
      totalIncome: parseFloat(row.total_income),
      totalExpenses: parseFloat(row.total_expenses),
    };
  }
}

export const transactionService = new TransactionService();
