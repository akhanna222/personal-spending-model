# 🖥️ Local Development Setup (VS Code / Windows Linux)

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed
- Git installed
- VS Code (optional but recommended)

## 1. Clone the Repository

```bash
git clone https://github.com/akhanna222/personal-spending-model.git
cd personal-spending-model
git checkout claude/bank-statement-extraction-pEtji
```

## 2. Setup PostgreSQL Database

### Option A: Using PostgreSQL locally

```bash
# Start PostgreSQL service
sudo service postgresql start

# Create database and user
sudo -u postgres psql
```

In the PostgreSQL prompt:
```sql
CREATE DATABASE spendlens;
CREATE USER spendlens_user WITH PASSWORD 'spendlens_password';
GRANT ALL PRIVILEGES ON DATABASE spendlens TO spendlens_user;
\q
```

### Option B: Using Docker (easier)

```bash
docker run --name spendlens-postgres \
  -e POSTGRES_DB=spendlens \
  -e POSTGRES_USER=spendlens_user \
  -e POSTGRES_PASSWORD=spendlens_password \
  -p 5432:5432 \
  -d postgres:14
```

## 3. Load Database Schema

```bash
# If using local PostgreSQL
psql -h localhost -U spendlens_user -d spendlens -f backend/schema.sql

# If using Docker
docker exec -i spendlens-postgres psql -U spendlens_user -d spendlens < backend/schema.sql
```

## 4. Setup Environment Variables

Create `.env` file in the `backend` folder:

```bash
cd backend
cat > .env << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=spendlens
DB_USER=spendlens_user
DB_PASSWORD=spendlens_password

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# OpenAI API Key (get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-your-key-here
EOF
```

## 5. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## 6. Build Backend

```bash
cd backend
npm run build
```

## 7. Run Backend

```bash
# Option A: Development mode (auto-reload)
npm run dev

# Option B: Production mode
npm start
```

You should see:
```
📊 Using individual DB_* environment variables
🔌 Testing database connection...
✅ Database connection test successful
✅ Database connected successfully
🚀 Server running on port 3001
✅ Server started successfully
```

## 8. Run Frontend (New Terminal)

```bash
cd frontend
npm run dev
```

Frontend will start on: http://localhost:5173

## 9. Test the Application

1. Open browser to http://localhost:5173
2. Click "Sign Up" and create an account
3. Login with your credentials
4. Upload a bank statement (PDF, CSV, or image)
5. View transactions and risk analysis

## 🔍 Troubleshooting

### Error: "OpenAI API key is not configured"
- **Solution**: Add `OPENAI_API_KEY` to `backend/.env`
- **Note**: App will start without it, but AI features won't work

### Error: "Database connection failed"
- Check PostgreSQL is running: `sudo service postgresql status`
- Verify credentials in `.env` match database setup
- Test connection: `psql -h localhost -U spendlens_user -d spendlens`

### Error: "Port 3001 already in use"
- Kill the process: `lsof -ti:3001 | xargs kill -9`
- Or change PORT in `.env`

### Error: "Port 5432 already in use"
- Stop existing PostgreSQL: `sudo service postgresql stop`
- Or use Docker PostgreSQL instead

## 📁 VS Code Setup

Open the project in VS Code:
```bash
code /path/to/personal-spending-model
```

### Recommended Extensions
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- PostgreSQL (for database management)

### VS Code Tasks
Create `.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Backend",
      "type": "shell",
      "command": "npm run dev",
      "options": { "cwd": "${workspaceFolder}/backend" },
      "problemMatcher": []
    },
    {
      "label": "Start Frontend",
      "type": "shell",
      "command": "npm run dev",
      "options": { "cwd": "${workspaceFolder}/frontend" },
      "problemMatcher": []
    }
  ]
}
```

## 🐛 Verifying the OpenAI Lazy Loading Fix

To verify the fix works locally:

1. **Without OPENAI_API_KEY** (should start successfully):
```bash
cd backend
# Remove or comment out OPENAI_API_KEY from .env
npm start
```
Expected: ✅ Server starts successfully

2. **Try to use AI features** (should show clear error):
Upload a PDF statement → should see error message (not crash)

3. **With OPENAI_API_KEY** (should work fully):
```bash
# Add OPENAI_API_KEY back to .env
npm start
```
Expected: ✅ All features work

## 🚀 Next Steps

Once local setup works:
1. Verify all features work locally
2. Compare with Railway deployment to identify the issue
3. Railway might need a fresh service (delete and recreate)
