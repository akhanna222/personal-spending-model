import Papa from 'papaparse';
import pdfParse from 'pdf-parse';
import { Transaction, ParsedStatement } from '../types';
import { extractTransactionsWithAI } from '../services/openaiService.optimized';

/**
 * OPTIMIZED: Universal parser - handles CSV, PDF, and Images with AI
 * Single entry point for all formats
 */
export async function parseStatement(
  fileBuffer: Buffer,
  fileName: string
): Promise<ParsedStatement> {
  const ext = fileName.toLowerCase().split('.').pop();

  try {
    // Try CSV first (fastest, no AI needed)
    if (ext === 'csv') {
      return await parseCSVFast(fileBuffer, fileName);
    }

    // For PDF, extract text first
    if (ext === 'pdf') {
      const pdfData = await pdfParse(fileBuffer);
      const transactions = await extractTransactionsWithAI(pdfData.text, fileName, false);
      return {
        transactions,
        metadata: {
          fileName,
          pageCount: pdfData.numpages,
          dateRange: getDateRange(transactions),
        },
      };
    }

    // For images, use Vision API directly (no OCR needed!)
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'].includes(ext || '')) {
      const transactions = await extractTransactionsWithAI(fileBuffer, fileName, true);
      return {
        transactions,
        metadata: {
          fileName,
          dateRange: getDateRange(transactions),
        },
      };
    }

    throw new Error(`Unsupported file type: ${ext}`);
  } catch (error) {
    throw new Error(`Failed to parse ${fileName}: ${error}`);
  }
}

/**
 * Fast CSV parser - no AI needed for structured data
 */
async function parseCSVFast(fileBuffer: Buffer, fileName: string): Promise<ParsedStatement> {
  const csvText = fileBuffer.toString('utf-8');

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions = results.data
            .map((row: any) => {
              // Smart column detection
              const date = findColumn(row, ['date', 'transaction date', 'posting date', 'trans date']);
              const desc = findColumn(row, ['description', 'details', 'memo', 'merchant', 'transaction text']);
              const balance = findColumn(row, ['balance', 'running balance', 'account balance']);

              if (!date || !desc) return null;

              const parsedDate = parseDate(date);
              if (!parsedDate) return null;

              // Smart amount detection
              const { payment_in, payment_out } = parseAmounts(row);
              if (payment_in === 0 && payment_out === 0) return null;

              return {
                id: crypto.randomUUID(),
                date: parsedDate,
                transaction_text: desc.trim(),
                payment_in,
                payment_out,
                balance: balance ? parseFloat(balance) : undefined,
                // Legacy
                amount: payment_in > 0 ? payment_in : -payment_out,
                currency: 'EUR',
                rawDescription: desc.trim(),
                isIncome: payment_in > 0,
              } as Transaction;
            })
            .filter(Boolean) as Transaction[];

          resolve({
            transactions,
            metadata: {
              fileName,
              dateRange: getDateRange(transactions),
            },
          });
        } catch (error) {
          reject(error);
        }
      },
      error: reject,
    });
  });
}

// Helper functions
function findColumn(row: any, names: string[]): string | null {
  for (const name of names) {
    const key = Object.keys(row).find(k => k.toLowerCase() === name.toLowerCase());
    if (key && row[key]) return row[key];
  }
  return null;
}

function parseAmounts(row: any): { payment_in: number; payment_out: number } {
  // Try explicit columns first
  const payIn = findColumn(row, ['payment in', 'credit', 'deposit', 'amount in', 'credits']);
  const payOut = findColumn(row, ['payment out', 'debit', 'withdrawal', 'amount out', 'debits']);

  if (payIn || payOut) {
    return {
      payment_in: payIn ? parseFloat(payIn.replace(/[^0-9.-]/g, '')) || 0 : 0,
      payment_out: payOut ? parseFloat(payOut.replace(/[^0-9.-]/g, '')) || 0 : 0,
    };
  }

  // Try single amount column
  const amount = findColumn(row, ['amount', 'transaction amount']);
  if (amount) {
    const value = parseFloat(amount.replace(/[^0-9.-]/g, ''));
    return value > 0
      ? { payment_in: value, payment_out: 0 }
      : { payment_in: 0, payment_out: Math.abs(value) };
  }

  return { payment_in: 0, payment_out: 0 };
}

function parseDate(dateStr: string): string | null {
  try {
    const cleaned = dateStr.trim().replace(/\s+/g, '');
    const date = new Date(cleaned);
    if (isNaN(date.getTime())) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
}

function getDateRange(transactions: Transaction[]): { start: string; end: string } | undefined {
  const dates = transactions.map(t => t.date).filter(Boolean).sort();
  return dates.length > 0 ? { start: dates[0], end: dates[dates.length - 1] } : undefined;
}
