import OpenAI from 'openai';
import { Transaction } from '../types';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model for vision-based extraction
const VISION_MODEL = 'gpt-4o'; // gpt-4o has vision capabilities

interface VisionTransactionExtraction {
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
    type: 'debit' | 'credit';
    balance?: number;
  }>;
  metadata: {
    accountNumber?: string;
    accountHolder?: string;
    bankName?: string;
    statementPeriod?: {
      start: string;
      end: string;
    };
    currency?: string;
  };
}

/**
 * Convert PDF or image to base64
 */
function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

/**
 * Extract transactions from bank statement using GPT-4 Vision
 * Supports: PDF (multi-page), PNG, JPG, scanned documents
 */
export async function extractTransactionsWithVision(
  fileBuffer: Buffer,
  fileName: string,
  fileType: 'pdf' | 'image'
): Promise<{
  transactions: Transaction[];
  metadata: {
    fileName: string;
    accountNumber?: string;
    accountHolder?: string;
    bankName?: string;
    dateRange?: {
      start: string;
      end: string;
    };
  };
}> {
  const base64Data = bufferToBase64(fileBuffer);

  // Determine MIME type
  let mimeType = 'image/jpeg';
  if (fileType === 'pdf') {
    mimeType = 'application/pdf';
  } else if (fileName.toLowerCase().endsWith('.png')) {
    mimeType = 'image/png';
  }

  const systemPrompt = `You are an expert bank statement parser. Extract ALL transactions from the provided bank statement document.

**IMPORTANT INSTRUCTIONS**:
1. Extract EVERY transaction visible in the document
2. Identify if each transaction is a DEBIT (money out) or CREDIT (money in)
3. Parse dates in ISO format (YYYY-MM-DD)
4. Extract exact amounts (convert to absolute numbers)
5. Preserve original transaction descriptions exactly as shown
6. Extract metadata: account number, bank name, statement period

**Date Handling**:
- Convert all dates to YYYY-MM-DD format
- Common formats: "15/01/2024", "Jan 15, 2024", "15-Jan-24"
- If year is missing, infer from statement period

**Amount Handling**:
- Debit/Payment/Withdrawal = type: "debit" (money going out)
- Credit/Deposit/Transfer In = type: "credit" (money coming in)
- Extract absolute amounts (no negative signs in amount field)

**Multi-page PDFs**:
- Extract ALL transactions from ALL pages
- Ensure no duplicates

Return ONLY valid JSON in this exact format:
{
  "transactions": [
    {
      "date": "2024-01-15",
      "description": "SAINSBURYS STORE 1234",
      "amount": 45.67,
      "type": "debit",
      "balance": 1234.56
    }
  ],
  "metadata": {
    "accountNumber": "12345678",
    "accountHolder": "John Smith",
    "bankName": "HSBC",
    "statementPeriod": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    },
    "currency": "GBP"
  }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all transactions from this bank statement. Return JSON only.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
                detail: 'high', // High detail for better OCR
              },
            },
          ],
        },
      ],
      temperature: 0.0,
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from GPT-4 Vision');
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Vision response');
    }

    const extracted: VisionTransactionExtraction = JSON.parse(jsonMatch[0]);

    // Convert to our Transaction format
    const transactions: Transaction[] = extracted.transactions.map((txn) => ({
      id: uuidv4(),
      date: txn.date,
      amount: txn.type === 'debit' ? -Math.abs(txn.amount) : Math.abs(txn.amount),
      currency: extracted.metadata.currency || 'GBP',
      rawDescription: txn.description,
      isIncome: txn.type === 'credit',
    }));

    return {
      transactions,
      metadata: {
        fileName,
        accountNumber: extracted.metadata.accountNumber,
        accountHolder: extracted.metadata.accountHolder,
        bankName: extracted.metadata.bankName,
        dateRange: extracted.metadata.statementPeriod,
      },
    };
  } catch (error: any) {
    console.error('Vision extraction error:', error);
    throw new Error(`Failed to extract transactions with Vision: ${error.message}`);
  }
}

/**
 * Process multiple pages of a bank statement
 * For multi-page PDFs, Vision API handles all pages automatically
 */
export async function extractMultiPageStatement(
  fileBuffer: Buffer,
  fileName: string
): Promise<{
  transactions: Transaction[];
  metadata: {
    fileName: string;
    pageCount?: number;
    accountNumber?: string;
    accountHolder?: string;
    bankName?: string;
    dateRange?: {
      start: string;
      end: string;
    };
  };
}> {
  // GPT-4o Vision handles multi-page PDFs automatically
  const fileType = fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';

  const result = await extractTransactionsWithVision(fileBuffer, fileName, fileType);

  return {
    ...result,
    metadata: {
      ...result.metadata,
      pageCount: fileType === 'pdf' ? undefined : 1, // Vision API doesn't return page count
    },
  };
}

/**
 * Validate extracted transactions
 */
export function validateExtractedTransactions(transactions: Transaction[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (transactions.length === 0) {
    errors.push('No transactions extracted');
  }

  transactions.forEach((txn, index) => {
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(txn.date)) {
      errors.push(`Transaction ${index + 1}: Invalid date format "${txn.date}"`);
    }

    // Validate amount
    if (typeof txn.amount !== 'number' || isNaN(txn.amount)) {
      errors.push(`Transaction ${index + 1}: Invalid amount "${txn.amount}"`);
    }

    // Validate description
    if (!txn.rawDescription || txn.rawDescription.trim().length === 0) {
      errors.push(`Transaction ${index + 1}: Empty description`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Deduplicate transactions (in case Vision extracts duplicates from multi-page docs)
 */
export function deduplicateTransactions(transactions: Transaction[]): Transaction[] {
  const seen = new Set<string>();
  const unique: Transaction[] = [];

  transactions.forEach((txn) => {
    const key = `${txn.date}-${txn.amount}-${txn.rawDescription}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(txn);
    }
  });

  return unique;
}
