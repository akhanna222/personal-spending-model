import Papa from 'papaparse';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import { Transaction, ParsedStatement } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parse CSV bank statement
 * Supports common CSV formats from major banks
 */
export async function parseCSV(fileBuffer: Buffer, fileName: string): Promise<ParsedStatement> {
  const csvText = fileBuffer.toString('utf-8');

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions: Transaction[] = [];
          let minDate = '';
          let maxDate = '';

          results.data.forEach((row: any) => {
            // Try to detect common column names (case-insensitive)
            const date = findColumn(row, ['date', 'transaction date', 'posting date', 'trans date']);
            const description = findColumn(row, ['description', 'transaction description', 'details', 'memo', 'merchant', 'transaction text']);
            const balance = findColumn(row, ['balance', 'running balance', 'account balance']);

            // Try to find payment in/out columns separately
            const paymentIn = findColumn(row, ['payment in', 'credit', 'deposit', 'amount in', 'credits']);
            const paymentOut = findColumn(row, ['payment out', 'debit', 'withdrawal', 'amount out', 'debits']);

            // If payment in/out not found separately, try to detect from amount
            const amount = findColumn(row, ['amount', 'transaction amount']);

            if (!date || !description) {
              return; // Skip rows without essential data
            }

            const parsedDate = parseDate(date);

            if (!parsedDate) {
              return; // Skip invalid data
            }

            // Parse payment in and payment out
            let parsedPaymentIn = 0;
            let parsedPaymentOut = 0;

            if (paymentIn && paymentOut) {
              // Separate columns for payment in and out
              parsedPaymentIn = parseAmount(paymentIn) || 0;
              parsedPaymentOut = parseAmount(paymentOut) || 0;
            } else if (amount) {
              // Single amount column - determine direction
              const parsedAmount = parseAmount(amount);
              if (!isNaN(parsedAmount)) {
                if (parsedAmount > 0) {
                  parsedPaymentIn = parsedAmount;
                } else {
                  parsedPaymentOut = Math.abs(parsedAmount);
                }
              }
            } else if (paymentIn) {
              parsedPaymentIn = parseAmount(paymentIn) || 0;
            } else if (paymentOut) {
              parsedPaymentOut = parseAmount(paymentOut) || 0;
            } else {
              return; // Skip if no amount data
            }

            // Parse balance
            const parsedBalance = balance ? parseAmount(balance) : undefined;

            // Track date range
            if (!minDate || parsedDate < minDate) minDate = parsedDate;
            if (!maxDate || parsedDate > maxDate) maxDate = parsedDate;

            transactions.push({
              id: uuidv4(),
              date: parsedDate,
              transaction_text: description.trim(),
              payment_in: parsedPaymentIn,
              payment_out: parsedPaymentOut,
              balance: parsedBalance,

              // Legacy fields for backward compatibility
              amount: parsedPaymentIn > 0 ? parsedPaymentIn : -parsedPaymentOut,
              currency: 'EUR',
              rawDescription: description.trim(),
              isIncome: parsedPaymentIn > 0,
            });
          });

          resolve({
            transactions,
            metadata: {
              fileName,
              dateRange: minDate && maxDate ? { start: minDate, end: maxDate } : undefined,
            },
          });
        } catch (error) {
          reject(new Error(`Error parsing CSV: ${error}`));
        }
      },
      error: (error) => {
        reject(new Error(`CSV parse error: ${error.message}`));
      },
    });
  });
}

/**
 * Parse PDF bank statement
 * Extracts text and attempts to identify transactions
 */
export async function parsePDF(fileBuffer: Buffer, fileName: string): Promise<ParsedStatement> {
  try {
    const data = await pdfParse(fileBuffer);
    const text = data.text;
    const pageCount = data.numpages;

    // Parse transactions from PDF text
    // This is a simplified parser - real-world would need bank-specific parsing
    const transactions = extractTransactionsFromPDFText(text);

    const dates = transactions.map(t => t.date).filter(Boolean).sort();
    const dateRange = dates.length > 0 ? {
      start: dates[0],
      end: dates[dates.length - 1],
    } : undefined;

    return {
      transactions,
      metadata: {
        fileName,
        pageCount,
        dateRange,
      },
    };
  } catch (error) {
    throw new Error(`Error parsing PDF: ${error}`);
  }
}

/**
 * Extract transactions from PDF text
 * Uses regex patterns to identify transaction lines
 */
function extractTransactionsFromPDFText(text: string): Transaction[] {
  const transactions: Transaction[] = [];
  const lines = text.split('\n');

  // Common patterns for transaction lines
  // Pattern: date amount description
  const datePattern = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/;
  const amountPattern = /[+-]?\s*\$?\€?\£?\s*[\d,]+\.\d{2}/;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Try to match date and amount
    const dateMatch = trimmedLine.match(datePattern);
    const amountMatches = trimmedLine.match(new RegExp(amountPattern, 'g'));

    if (dateMatch && amountMatches && amountMatches.length > 0) {
      const date = parseDate(dateMatch[0]);
      if (!date) continue;

      // Take the last amount match (usually the transaction amount)
      const amount = parseAmount(amountMatches[amountMatches.length - 1]);
      if (isNaN(amount)) continue;

      // Extract description (text between date and amount)
      let description = trimmedLine
        .replace(dateMatch[0], '')
        .replace(amountMatches[amountMatches.length - 1], '')
        .trim();

      // Remove balance if present (usually the second-to-last number)
      if (amountMatches.length > 1) {
        description = description.replace(amountMatches[amountMatches.length - 2], '').trim();
      }

      if (description.length < 3) continue; // Skip if description too short

      // Determine payment direction
      const payment_in = amount > 0 ? amount : 0;
      const payment_out = amount < 0 ? Math.abs(amount) : 0;

      // Try to extract balance if present (usually the second-to-last number)
      let balance: number | undefined = undefined;
      if (amountMatches.length > 1) {
        const potentialBalance = parseAmount(amountMatches[amountMatches.length - 2]);
        if (!isNaN(potentialBalance)) {
          balance = potentialBalance;
        }
      }

      transactions.push({
        id: uuidv4(),
        date,
        transaction_text: description,
        payment_in,
        payment_out,
        balance,

        // Legacy fields for backward compatibility
        amount,
        currency: 'EUR',
        rawDescription: description,
        isIncome: amount > 0,
      });
    }
  }

  return transactions;
}

/**
 * Find column value by trying multiple possible header names
 */
function findColumn(row: any, possibleNames: string[]): string | null {
  for (const name of possibleNames) {
    // Try exact match
    if (row[name]) return row[name];

    // Try case-insensitive match
    const key = Object.keys(row).find(k => k.toLowerCase() === name.toLowerCase());
    if (key && row[key]) return row[key];
  }
  return null;
}

/**
 * Parse date string to YYYY-MM-DD format
 */
function parseDate(dateStr: string): string | null {
  const cleaned = dateStr.trim().replace(/\s+/g, '');

  // Try various date formats
  const formats = [
    /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/, // YYYY-MM-DD or YYYY/MM/DD
    /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/, // DD-MM-YYYY or DD/MM/YYYY
    /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})$/, // DD-MM-YY or DD/MM/YY
  ];

  for (const format of formats) {
    const match = cleaned.match(format);
    if (match) {
      let year: string, month: string, day: string;

      if (format === formats[0]) {
        // YYYY-MM-DD
        [, year, month, day] = match;
      } else {
        // DD-MM-YYYY or DD-MM-YY
        [, day, month, year] = match;
        if (year.length === 2) {
          year = (parseInt(year) > 50 ? '19' : '20') + year;
        }
      }

      // Pad month and day with zeros
      month = month.padStart(2, '0');
      day = day.padStart(2, '0');

      return `${year}-${month}-${day}`;
    }
  }

  return null;
}

/**
 * Parse amount string to number
 */
function parseAmount(amountStr: string): number {
  // Remove currency symbols and spaces
  let cleaned = amountStr.replace(/[$€£\s]/g, '').replace(/,/g, '');

  // Handle parentheses for negative numbers
  if (cleaned.includes('(') && cleaned.includes(')')) {
    cleaned = '-' + cleaned.replace(/[()]/g, '');
  }

  return parseFloat(cleaned);
}

/**
 * Parse image bank statement using OCR
 * Supports PNG, JPG, JPEG, and other image formats
 */
export async function parseImage(fileBuffer: Buffer, fileName: string): Promise<ParsedStatement> {
  try {
    console.log(`Starting OCR on image: ${fileName}`);

    // Perform OCR on the image
    const { data: { text } } = await Tesseract.recognize(
      fileBuffer,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      }
    );

    console.log('OCR completed, extracting transactions...');

    // Use the same transaction extraction logic as PDF
    const transactions = extractTransactionsFromPDFText(text);

    const dates = transactions.map(t => t.date).filter(Boolean).sort();
    const dateRange = dates.length > 0 ? {
      start: dates[0],
      end: dates[dates.length - 1],
    } : undefined;

    return {
      transactions,
      metadata: {
        fileName,
        dateRange,
      },
    };
  } catch (error) {
    console.error('Error parsing image:', error);
    throw new Error(`Error parsing image: ${error}`);
  }
}
