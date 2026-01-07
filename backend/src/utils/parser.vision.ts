import Papa from 'papaparse';
import pdfParse from 'pdf-parse';
import { Transaction, ParsedStatement } from '../types';
import { extractTransactionsWithVision } from '../services/openaiService.vision';

/**
 * ZERO-REGEX PARSER
 * AI does ALL extraction - no regex patterns!
 */
export async function parseStatementVision(
  fileBuffer: Buffer,
  fileName: string
): Promise<ParsedStatement> {
  const ext = fileName.toLowerCase().split('.').pop();

  try {
    // CSV: Structured data - fast parsing (no AI needed)
    if (ext === 'csv') {
      return await parseCSVStructured(fileBuffer, fileName);
    }

    // PDF: Extract text → Send to GPT-4o (NO REGEX!)
    if (ext === 'pdf') {
      console.log(`Extracting text from PDF: ${fileName}`);
      const pdfData = await pdfParse(fileBuffer);
      console.log(`Sending ${pdfData.text.length} chars to GPT-4o for extraction`);

      const transactions = await extractTransactionsWithVision(pdfData.text, fileName, 'text');

      return {
        transactions,
        metadata: {
          fileName,
          pageCount: pdfData.numpages,
          dateRange: getDateRange(transactions),
        },
      };
    }

    // Images: Send directly to GPT-4o Vision (NO OCR!)
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp'].includes(ext || '')) {
      console.log(`Sending image to GPT-4o Vision: ${fileName}`);
      const transactions = await extractTransactionsWithVision(fileBuffer, fileName, 'image');

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
    console.error(`Parse error for ${fileName}:`, error);
    throw new Error(`Failed to parse ${fileName}: ${error}`);
  }
}

/**
 * Fast CSV parser - structured data doesn't need AI
 * Uses smart column detection, not regex
 */
async function parseCSVStructured(
  fileBuffer: Buffer,
  fileName: string
): Promise<ParsedStatement> {
  const csvText = fileBuffer.toString('utf-8');

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Keep as strings for safety
      complete: (results) => {
        try {
          const transactions = results.data
            .map((row: any) => {
              // Smart column detection (case-insensitive, fuzzy matching)
              const date = findColumn(row, [
                'date',
                'transaction date',
                'trans date',
                'posting date',
                'value date',
              ]);

              const desc = findColumn(row, [
                'description',
                'transaction description',
                'details',
                'memo',
                'merchant',
                'transaction text',
                'narration',
              ]);

              const balance = findColumn(row, [
                'balance',
                'running balance',
                'account balance',
                'closing balance',
              ]);

              if (!date || !desc) return null;

              const parsedDate = smartParseDate(date);
              if (!parsedDate) return null;

              // Smart amount detection
              const { payment_in, payment_out } = extractAmounts(row);
              if (payment_in === 0 && payment_out === 0) return null;

              const parsedBalance = balance ? parseFloat(balance.replace(/[^0-9.-]/g, '')) : undefined;

              return {
                id: crypto.randomUUID(),
                date: parsedDate,
                transaction_text: desc.trim(),
                payment_in,
                payment_out,
                balance: isNaN(parsedBalance!) ? undefined : parsedBalance,

                // Legacy compatibility
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
      error: (error) => reject(error),
    });
  });
}

/**
 * Smart column finder - case insensitive, handles variations
 */
function findColumn(row: any, possibleNames: string[]): string | null {
  for (const name of possibleNames) {
    // Try exact case-insensitive match
    const key = Object.keys(row).find(k => k.toLowerCase() === name.toLowerCase());
    if (key && row[key]) return String(row[key]);

    // Try partial match (contains)
    const partialKey = Object.keys(row).find(k =>
      k.toLowerCase().includes(name.toLowerCase().split(' ')[0])
    );
    if (partialKey && row[partialKey]) return String(row[partialKey]);
  }
  return null;
}

/**
 * Extract payment_in and payment_out from row
 * Handles multiple CSV formats
 */
function extractAmounts(row: any): { payment_in: number; payment_out: number } {
  // Try explicit debit/credit columns
  const credit = findColumn(row, ['credit', 'payment in', 'deposit', 'amount in', 'credits', 'cr']);
  const debit = findColumn(row, ['debit', 'payment out', 'withdrawal', 'amount out', 'debits', 'dr']);

  if (credit || debit) {
    const creditVal = credit ? parseFloat(credit.replace(/[^0-9.-]/g, '')) || 0 : 0;
    const debitVal = debit ? parseFloat(debit.replace(/[^0-9.-]/g, '')) || 0 : 0;
    return { payment_in: creditVal, payment_out: debitVal };
  }

  // Try single amount column with sign
  const amount = findColumn(row, ['amount', 'transaction amount', 'value']);
  if (amount) {
    const value = parseFloat(amount.replace(/[^0-9.-]/g, ''));
    if (!isNaN(value)) {
      return value >= 0
        ? { payment_in: value, payment_out: 0 }
        : { payment_in: 0, payment_out: Math.abs(value) };
    }
  }

  return { payment_in: 0, payment_out: 0 };
}

/**
 * Smart date parser - handles multiple formats
 * Uses Date constructor for robust parsing
 */
function smartParseDate(dateStr: string): string | null {
  try {
    const cleaned = dateStr.trim();

    // Try ISO format first
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
      return cleaned;
    }

    // Try parsing with Date constructor
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Try common formats manually
    // DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dmyMatch) {
      const [, day, month, year] = dmyMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // MM/DD/YYYY or MM-DD-YYYY
    const mdyMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (mdyMatch) {
      const [, month, day, year] = mdyMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get date range from transactions
 */
function getDateRange(transactions: Transaction[]): { start: string; end: string } | undefined {
  const dates = transactions.map(t => t.date).filter(Boolean).sort();
  return dates.length > 0 ? { start: dates[0], end: dates[dates.length - 1] } : undefined;
}
