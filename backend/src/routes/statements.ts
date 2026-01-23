import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { statementService } from '../services/statementService';
import { transactionService } from '../services/transactionService';

const router = Router();

/**
 * GET /api/statements
 * Get all bank statements for the authenticated user
 */
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const result = await statementService.getUserStatements(req.user!.id, limit, offset);

    res.json({
      statements: result.statements,
      pagination: {
        total: result.total,
        page,
        limit,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    console.error('Get statements error:', error);
    res.status(500).json({ error: 'Failed to get statements' });
  }
});

/**
 * GET /api/statements/stats
 * Get statement statistics
 */
router.get('/stats', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await statementService.getStatementStats(req.user!.id);
    res.json({ stats });
  } catch (error) {
    console.error('Get statement stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

/**
 * GET /api/statements/:id
 * Get a single statement by ID
 */
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const statement = await statementService.getStatementById(req.params.id, req.user!.id);

    if (!statement) {
      res.status(404).json({ error: 'Statement not found' });
      return;
    }

    // Get transactions for this statement
    const transactions = await transactionService.getUserTransactions(req.user!.id, {
      limit: 1000,
      offset: 0,
    });

    res.json({
      statement,
      transactions: transactions.transactions,
    });
  } catch (error) {
    console.error('Get statement error:', error);
    res.status(500).json({ error: 'Failed to get statement' });
  }
});

/**
 * DELETE /api/statements/:id
 * Delete a statement and all its transactions
 */
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deleted = await statementService.deleteStatement(req.params.id, req.user!.id);

    if (!deleted) {
      res.status(404).json({ error: 'Statement not found' });
      return;
    }

    res.json({ message: 'Statement deleted successfully' });
  } catch (error) {
    console.error('Delete statement error:', error);
    res.status(500).json({ error: 'Failed to delete statement' });
  }
});

export default router;
