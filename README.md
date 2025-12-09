# SpendLens

> A web app that ingests bank statements, enriches transactions with LLM-generated context, and builds behavioral spending profiles.

## Overview

SpendLens helps individuals understand their spending patterns by:
- Uploading 6-12 months of bank statements (PDF/CSV)
- Automatically extracting and parsing transactions
- Using AI (Claude) to enrich transaction descriptions and categorize spending
- Generating behavioral insights and spending forecasts
- Visualizing spending patterns with interactive charts

## Features

### Core Functionality
- **Multi-format Statement Upload**: Support for PDF and CSV bank statements
- **AI-Powered Transaction Enhancement**: Uses Claude AI to:
  - Generate human-readable transaction descriptions
  - Identify merchants and transaction channels
  - Auto-categorize into 100+ detailed spending categories
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

### Category Taxonomy
Transactions are categorized into PRIMARY and DETAILED levels:
- **INCOME**: Salary, Freelance, Investment, etc.
- **RENT_AND_UTILITIES**: Rent, Mortgage, Electricity, Internet, etc.
- **FOOD_AND_DRINK**: Groceries, Restaurants, Coffee, etc.
- **TRANSPORTATION**: Gas, Public Transit, Rideshare, etc.
- **ENTERTAINMENT**: Streaming, Gaming, Events, etc.
- **SHOPPING**: Clothing, Electronics, Home & Garden, etc.
- **MEDICAL**: Doctor, Pharmacy, Dental, Insurance, etc.
- **TRAVEL**: Flights, Hotels, Rental Cars, etc.
- And many more...

See `shared/category-data.json` for the complete taxonomy.

## Tech Stack

### Backend
- **Node.js + Express**: RESTful API server
- **TypeScript**: Type-safe backend code
- **Anthropic Claude API**: LLM for transaction enhancement
- **pdf-parse**: PDF statement parsing
- **papaparse**: CSV parsing

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

### Prerequisites
- Node.js 18+ and npm
- Anthropic API key (get one at https://console.anthropic.com/)

### Installation

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
   ANTHROPIC_API_KEY=your_api_key_here
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
- Drag and drop or browse to select PDF/CSV bank statements
- Upload multiple files at once (6-12 months recommended)
- Wait for parsing to complete

### 2. Review Transactions
- View all extracted transactions in the table
- Use search and filters to find specific transactions
- Toggle "Show AI descriptions" to see enhanced vs raw descriptions
- Click "Enhance All with AI" to process transactions with Claude
  - This may take a few minutes depending on the number of transactions
  - Each transaction gets an enriched description and category

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
Edit `shared/category-data.json` to customize categories. Each category has:
```json
{
  "PRIMARY": "FOOD_AND_DRINK",
  "DETAILED": "FOOD_AND_DRINK_GROCERIES",
  "DESCRIPTION": "Purchases for fresh produce and groceries from supermarkets"
}
```

### Claude Model
The backend uses `claude-3-5-sonnet-20241022` by default. Modify in `backend/src/services/claudeService.ts` if needed.

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
- Check that ANTHROPIC_API_KEY is set correctly in backend/.env
- Ensure you have API credits remaining
- Try enhancing fewer transactions at once

### Transactions not parsing correctly
- Ensure PDF/CSV is a bank statement (not a scanned image)
- Check that CSV has Date, Amount, and Description columns
- Try a different file format

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
- [Anthropic Claude](https://www.anthropic.com/) - AI-powered transaction enhancement
- [React](https://react.dev/) - Frontend framework
- [Express](https://expressjs.com/) - Backend framework
- [Recharts](https://recharts.org/) - Data visualization
- [TailwindCSS](https://tailwindcss.com/) - Styling

---

**Note**: This is a demo application. For production use, implement proper security, authentication, data persistence, and error handling.
