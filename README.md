# SpendLens

> A web app that ingests bank statements, enriches transactions with LLM-generated context, and builds behavioral spending profiles.

## Overview

SpendLens helps individuals understand their spending patterns by:
- Uploading 6-12 months of bank statements (PDF/CSV/Images)
- Automatically extracting and parsing transactions with OCR support
- Using AI (OpenAI GPT-4) to enrich transaction descriptions and categorize spending
- Matching transactions to comprehensive Plaid category taxonomy
- Generating behavioral insights and spending forecasts
- Visualizing spending patterns with interactive charts

## Features

### Core Functionality
- **Multi-format Statement Upload**: Support for PDF, CSV, and image bank statements (PNG, JPG, JPEG, etc.)
- **OCR Support**: Automatically extract text from scanned images and multi-page PDFs
- **AI-Powered Transaction Enhancement**: Uses OpenAI GPT-4 to:
  - Generate clear, human-readable transaction descriptions
  - Match transactions to Plaid's comprehensive category taxonomy (200+ categories)
  - Strictly match based on transaction text, description, and payment direction
- **Transaction Review Interface**:
  - Search, filter, and sort transactions
  - Manual category override
  - Bulk operations
- **Behavioral Spending Analytics**:
  - Income vs spend tracking
  - Category-level breakdowns
  - Recurring payment detection
  - Fixed vs variable cost analysis
  - 3-month spending forecasts
- **Data Export**: Export cleaned transactions as CSV

### Transaction Schema
Each transaction is extracted with the following fields:
- **date**: Transaction date (YYYY-MM-DD)
- **transaction_text**: Raw transaction text from bank statement
- **payment_in**: Amount received (0 if not applicable)
- **payment_out**: Amount paid (0 if not applicable)
- **balance**: Account balance after transaction (if available)
- **transaction_description**: AI-generated human-readable description
- **transaction_primary**: Plaid primary category
- **transaction_detailed**: Plaid detailed category

### Plaid Category Taxonomy
Transactions are categorized using Plaid's comprehensive taxonomy with PRIMARY and DETAILED levels:
- **INCOME**: Wages, Dividends, Interest, Tax Refund, etc.
- **TRANSFER_IN/OUT**: Account transfers, deposits, withdrawals
- **LOAN_PAYMENTS**: Car, Credit Card, Mortgage, Student Loan, etc.
- **BANK_FEES**: ATM fees, Overdraft, Foreign Transaction, etc.
- **ENTERTAINMENT**: TV & Movies, Music, Gaming, Sports Events, etc.
- **FOOD_AND_DRINK**: Groceries, Restaurants, Coffee, Fast Food, etc.
- **GENERAL_MERCHANDISE**: Clothing, Electronics, Online Marketplaces, etc.
- **HOME_IMPROVEMENT**: Furniture, Hardware, Repair, etc.
- **MEDICAL**: Dental, Eye Care, Pharmacy, Primary Care, etc.
- **PERSONAL_CARE**: Gyms, Hair & Beauty, Laundry, etc.
- **GENERAL_SERVICES**: Accounting, Automotive, Education, Insurance, etc.
- **GOVERNMENT_AND_NON_PROFIT**: Donations, Tax Payments, etc.
- **TRANSPORTATION**: Gas, Public Transit, Rideshare, Parking, etc.
- **TRAVEL**: Flights, Hotels, Rental Cars, etc.
- **RENT_AND_UTILITIES**: Rent, Gas & Electricity, Internet, Phone, Water, etc.
- And many more...

See `shared/plaid-categories.json` for the complete Plaid taxonomy (200+ categories).

## Tech Stack

### Backend
- **Node.js + Express**: RESTful API server
- **TypeScript**: Type-safe backend code
- **OpenAI GPT-4**: LLM for transaction description and categorization
- **pdf-parse**: PDF statement parsing
- **papaparse**: CSV parsing
- **tesseract.js**: OCR for image-based bank statements

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type-safe frontend code
- **Vite**: Fast build tool and dev server
- **TailwindCSS**: Utility-first styling
- **Recharts**: Data visualization
- **React Router**: Client-side routing
- **Axios**: HTTP client

## Project Structure

```
spendlens/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic (Claude, behavioral model)
│   │   ├── utils/          # Utilities (parsers)
│   │   ├── types/          # TypeScript types
│   │   └── server.ts       # Main server file
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # Frontend React app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components (Landing, Transactions, etc.)
│   │   ├── services/       # API client
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx         # Main app component
│   │   └── main.tsx        # Entry point
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── shared/                  # Shared resources
│   └── category-data.json  # Category taxonomy
├── package.json            # Root package.json (workspace)
└── README.md
```

## Getting Started

### Quick Start with Antigravity (Recommended)

The fastest way to run SpendLens locally is using Antigravity, which automatically handles environment setup:

1. **Install Antigravity** (if you haven't already)
   ```bash
   npm install -g @antigravity/cli
   ```

2. **Clone and launch**
   ```bash
   git clone https://github.com/akhanna222/personal-spending-model.git
   cd personal-spending-model
   antigravity dev
   ```

3. **Set your OpenAI API key**

   When prompted, enter your OpenAI API key (get one at https://platform.openai.com/)

   Or set it manually:
   ```bash
   export OPENAI_API_KEY=your_api_key_here
   antigravity dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

Antigravity will automatically:
- Install all dependencies (backend + frontend)
- Set up the development environment
- Start both servers concurrently
- Watch for file changes and hot-reload

### Manual Installation

If you prefer to set up manually without Antigravity:

#### Prerequisites
- Node.js 18+ and npm
- OpenAI API key (get one at https://platform.openai.com/)

#### Installation

1. **Clone the repository**
   ```bash
   cd personal-spending-model
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

3. **Set up environment variables**

   Create `backend/.env`:
   ```bash
   OPENAI_API_KEY=your_api_key_here
   PORT=3001
   NODE_ENV=development
   ```

4. **Start the development servers**

   From the root directory:
   ```bash
   npm run dev
   ```

   This will start:
   - Backend API on http://localhost:3001
   - Frontend dev server on http://localhost:3000

### Building for Production

```bash
# Build both frontend and backend
npm run build

# Or build individually
npm run build:backend
npm run build:frontend

# Start production backend
cd backend && npm start
```

## Usage Guide

### 1. Upload Bank Statements
- Navigate to http://localhost:3000
- Drag and drop or browse to select bank statements
  - Supported formats: PDF, CSV, PNG, JPG, JPEG
  - Images will be processed with OCR automatically
  - Multi-page PDFs are supported
- Upload multiple files at once (6-12 months recommended)
- Wait for parsing to complete (OCR may take longer for image files)

### 2. Review Transactions
- View all extracted transactions in the table
- Use search and filters to find specific transactions
- Toggle "Show AI descriptions" to see enhanced vs raw descriptions
- Click "Enhance All with AI" to process transactions with OpenAI
  - This may take a few minutes depending on the number of transactions
  - Each transaction gets a human-readable description and Plaid category match
  - Matching is strict - only confident matches are assigned categories

### 3. Manual Review
- Click on any transaction to view details in the side drawer
- Review AI-assigned categories
- Override categories if needed using the dropdowns
- See confidence scores and adjust low-confidence transactions

### 4. View Insights
- Navigate to "View Insights" to see the behavioral dashboard
- Explore:
  - Monthly income vs spend trends
  - Category breakdowns (pie charts and bars)
  - Recurring payments detected
  - Fixed vs variable spending analysis
  - 3-month spending forecast
  - AI-generated insights

### 5. Export Data
- Click "Export CSV" on the dashboard
- Download cleaned transactions with all enriched fields
- Use this data in Excel, Google Sheets, or other tools

## API Endpoints

### Statements & Transactions
- `POST /api/upload` - Upload bank statements (PDF/CSV)
- `GET /api/transactions` - Get all transactions (with filters)
- `PATCH /api/transactions/:id` - Update a transaction
- `POST /api/transactions/enhance` - Enhance transactions with AI

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:primary` - Get detailed categories for a primary category

### Insights & Export
- `GET /api/insights` - Generate behavioral insights
- `GET /api/export/csv` - Export transactions as CSV
- `DELETE /api/transactions` - Clear all data (for testing)

### Health
- `GET /health` - Health check endpoint

## Configuration

### Category Taxonomy
Edit `shared/plaid-categories.json` to customize Plaid categories. Each category has:
```json
{
  "PRIMARY": "FOOD_AND_DRINK",
  "DETAILED": "FOOD_AND_DRINK_GROCERIES",
  "DESCRIPTION": "Purchases for fresh produce and groceries, including farmers' markets"
}
```

### OpenAI Model
The backend uses `gpt-4o-mini` by default for cost-effective processing. Modify in `backend/src/services/openaiService.ts` if needed.
- Transaction descriptions use `temperature: 0.3` for consistent outputs
- Category matching uses `temperature: 0.1` and JSON mode for strict matching

### Parser Configuration
PDF and CSV parsers are in `backend/src/utils/parser.ts`. Customize parsing logic for specific bank formats.

## Development Tips

### Hot Reloading
Both frontend and backend support hot reloading during development:
- Frontend: Vite provides instant HMR
- Backend: tsx watch mode restarts on file changes

### Type Safety
Both frontend and backend use TypeScript. Shared types are in `backend/src/types/index.ts` and `frontend/src/types/index.ts`.

### Debugging
- Backend logs to console (check terminal)
- Frontend logs to browser console
- API errors include detailed messages

## Limitations & Future Enhancements

### Current Limitations
- In-memory storage (data lost on server restart)
- Single-user (no authentication)
- Limited PDF parsing (works best with structured statements)
- CSV format detection is heuristic-based

### Future V2 Features
- **User Accounts**: Save data across sessions, compare time periods
- **Bank API Integration**: Connect directly via Plaid/Tink/TrueLayer
- **Budget Goals**: Set category-level budgets and track progress
- **Recommendations**: AI-powered suggestions to optimize spending
- **Benchmarking**: Compare against similar user cohorts
- **Mobile App**: Native iOS/Android apps
- **Multi-currency**: Support for multiple currencies
- **Receipt Scanning**: OCR for receipt uploads
- **Notifications**: Alerts for unusual spending or budget overruns

## Security Considerations

### Current Implementation
- File uploads are processed in-memory (not persisted)
- No authentication (single-user demo)
- HTTPS recommended for production
- API keys stored in environment variables

### Production Recommendations
- Add user authentication (JWT, OAuth)
- Store data in encrypted database (PostgreSQL + pgcrypto)
- Implement file size limits and virus scanning
- Use rate limiting on AI endpoints
- Add CORS restrictions
- Enable HTTPS/TLS
- Implement audit logging
- Regular security updates

## Troubleshooting

### "Enhancement failed" error
- Check that OPENAI_API_KEY is set correctly in backend/.env or environment
- Ensure you have API credits remaining in your OpenAI account
- Try enhancing fewer transactions at once to avoid rate limits
- Check backend console logs for detailed error messages

### Transactions not parsing correctly
- **PDF**: Ensure it's a text-based PDF (not a scanned image). If scanned, save as PNG/JPG and upload as image
- **CSV**: Check that CSV has columns like Date, Amount/Debit/Credit, and Description
- **Images**: Ensure good quality and clear text. OCR works best with high-resolution, well-lit images
- Try a different file format if one isn't working

### OCR taking too long
- Image OCR can take 30-60 seconds per page depending on image size and quality
- Consider using CSV format for faster processing
- For multi-page statements, consider splitting into separate files

### Charts not showing
- Ensure transactions are categorized (run enhancement)
- Check browser console for errors
- Verify backend insights endpoint returns data

### Server won't start
- Check that ports 3000 and 3001 are not in use
- Run `npm install` in both backend and frontend directories
- Check Node.js version (18+ required)

## Contributing

This is a demo project built from a product specification. To extend:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project as a starting point for your own spending tracker!

## Credits

Built with:
- [OpenAI GPT-4](https://openai.com/) - AI-powered transaction description and categorization
- [Plaid Categories](https://plaid.com/) - Comprehensive financial transaction taxonomy
- [React](https://react.dev/) - Frontend framework
- [Express](https://expressjs.com/) - Backend framework
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR for image processing
- [Recharts](https://recharts.org/) - Data visualization
- [TailwindCSS](https://tailwindcss.com/) - Styling

---

**Note**: This is a demo application. For production use, implement proper security, authentication, data persistence, and error handling.
