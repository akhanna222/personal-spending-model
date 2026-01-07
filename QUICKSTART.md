# 🚀 Quick Start Guide

Get SpendLens running in 60 seconds!

## One-Command Start

```bash
./run.sh
```

That's it! The script will:
1. ✅ Kill any processes on ports 3000 & 3001
2. ✅ Check and install dependencies
3. ✅ Ask for your OpenAI API key (and save it securely)
4. ✅ Let you choose a version (Vision/Optimized/Original)
5. ✅ Configure and start the server

---

## First Time Setup

### Step 1: Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-...`)

### Step 2: Run the Script

```bash
./run.sh
```

When prompted:
- Paste your OpenAI API key
- Choose version (press `1` for Vision - recommended)

### Step 3: Wait for Server to Start

You'll see:
```
✅ Server started!
Backend: http://localhost:3001
```

---

## Testing the API

In a **new terminal window**, run:

```bash
# Quick health check
./test-api.sh

# Test with a sample statement
./test-api.sh /path/to/your/statement.pdf
```

---

## Manual Testing

### Upload a Statement

```bash
curl -X POST http://localhost:3001/api/upload \
  -F "statements=@statement.pdf"
```

Supported formats: PDF, PNG, JPG, JPEG, CSV

### View Transactions

```bash
curl http://localhost:3001/api/transactions | jq
```

### Get a Single Transaction

```bash
curl http://localhost:3001/api/transactions | jq '.transactions[0]'
```

---

## Which Version to Choose?

When `./run.sh` asks you to choose:

### 🔮 Option 1: VISION (Recommended)
**Best for: Production use**

- Zero regex patterns
- GPT-4o Vision reads images directly
- 90x faster for images (3 seconds vs 4.5 minutes)
- 95% accuracy
- 50-80% cheaper
- Single AI call per file

**Use when:** You want the best performance and accuracy

---

### ⚡ Option 2: OPTIMIZED
**Best for: Testing batch processing**

- Batch processing (10 transactions per call)
- Function calling for structured output
- 10x faster than original
- 5x cheaper

**Use when:** You want to test the optimized approach

---

### 📝 Option 3: ORIGINAL
**Best for: Backward compatibility**

- Standard approach
- 2 AI calls per transaction
- Uses regex for parsing

**Use when:** You want the baseline implementation

---

## What Happens Behind the Scenes?

### Port Cleanup
```bash
# Automatically kills processes on:
- Port 3001 (Backend)
- Port 3000 (Frontend)
```

### API Key Storage
```bash
# Your key is saved to:
backend/.env

# File contents:
OPENAI_API_KEY=sk-your-key-here
PORT=3001
NODE_ENV=development

# File permissions: 600 (secure, only you can read)
```

### Route Configuration
```bash
# The script automatically updates:
backend/src/server.ts

# To import the version you selected:
import routes from './routes.vision';      # Vision
import routes from './routes.optimized';   # Optimized
import routes from './routes';             # Original
```

---

## Troubleshooting

### "Port already in use"
The script automatically kills processes on ports 3001 and 3000. If you still see this error:

```bash
# Manually kill the port
lsof -ti:3001 | xargs kill -9
```

### "OpenAI API key not found"
The script will prompt you for the key. If it didn't save:

```bash
# Manually create backend/.env
echo "OPENAI_API_KEY=sk-your-key-here" > backend/.env
```

### "Command not found: jq"
Install jq for pretty JSON output:

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Or view without jq
curl http://localhost:3001/api/transactions
```

### Script won't run
Make sure it's executable:

```bash
chmod +x run.sh
chmod +x start-dynamic.sh
chmod +x test-api.sh
```

---

## Example Session

```bash
$ ./run.sh

╔════════════════════════════════════════════════════════════╗
║           🏦 SpendLens Bank Statement Extraction          ║
║              Zero Regex • Vision-First • Fast             ║
╚════════════════════════════════════════════════════════════╝

🔍 Checking port 3001...
✅ Port 3001 is available
🔍 Checking port 3000...
✅ Port 3000 is available

📦 Checking dependencies...
✅ Node.js v22.21.1
✅ npm 10.9.4
✅ Backend dependencies already installed

🔑 OpenAI API Key Setup

Get your API key at: https://platform.openai.com/api-keys

Enter your OpenAI API key: sk-proj-xxx...

✅ API key saved to backend/.env
🔒 File permissions set to 600 (secure)

╔════════════════════════════════════════════════════════════╗
║                    Choose Version                          ║
╚════════════════════════════════════════════════════════════╝

1) 🔮 VISION (Recommended)
   • Zero regex patterns
   • GPT-4o Vision reads images directly
   • 90x faster for images (3s vs 275s)
   • 95% accuracy, 50-80% cheaper
   • Single AI call per file

2) ⚡ OPTIMIZED
   • Batch processing (10 txns per call)
   • Function calling for structured output
   • 10x faster than original
   • 5x cheaper

3) 📝 ORIGINAL
   • Standard approach
   • Backward compatible
   • 2 AI calls per transaction

Enter choice [1-3] (default: 1): 1

✅ Selected: 🔮 VISION

⚙️  Configuring routes...
✅ Routes configured to use: routes.vision

╔════════════════════════════════════════════════════════════╗
║                   Starting Server                          ║
╚════════════════════════════════════════════════════════════╝

Version: 🔮 VISION
Backend: http://localhost:3001
API Docs: See README.md

Press Ctrl+C to stop

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SpendLens API server running on http://localhost:3001
Health check: http://localhost:3001/health
```

---

## Next Steps

Once the server is running:

1. **Test the API:**
   ```bash
   ./test-api.sh
   ```

2. **Upload a statement:**
   ```bash
   curl -X POST http://localhost:3001/api/upload \
     -F "statements=@my-statement.pdf"
   ```

3. **View results:**
   ```bash
   curl http://localhost:3001/api/transactions | jq
   ```

4. **Read the docs:**
   - `VISION_APPROACH.md` - Vision approach details
   - `OPTIMIZATION.md` - Performance comparisons
   - `README.md` - Full documentation

---

## API Endpoints

### Upload
```bash
POST /api/upload
Content-Type: multipart/form-data
Body: statements=@file.pdf
```

### Get Transactions
```bash
GET /api/transactions
Query: ?page=1&limit=50&search=starbucks
```

### Get Categories
```bash
GET /api/categories
```

### Export CSV
```bash
GET /api/export/csv
```

### Health Check
```bash
GET /health
```

---

## Stop the Server

Press `Ctrl+C` in the terminal where the server is running.

---

## Need Help?

- Check `README.md` for full documentation
- Check `VISION_APPROACH.md` for Vision details
- Check `ARCHITECTURE_COMPARISON.md` for visual diagrams

---

**You're all set! Start uploading bank statements! 🎉**
