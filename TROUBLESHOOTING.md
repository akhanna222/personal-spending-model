# SpendLens Troubleshooting Guide

## Common Issues and Solutions

### 1. "Cannot GET" Error

**Cause:** Frontend server is not running or dependencies are not installed.

**Solution:**

**Step 1: Make sure you're in the project root directory**
```powershell
cd path\to\personal-spending-model
```

**Step 2: Install all dependencies**
```powershell
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

**Step 3: Start the servers**
```powershell
npm run dev
```

You should see:
- Backend starting on port 3001
- Frontend starting on port 3000

**Step 4: Access the application**
- Open your browser to: http://localhost:3000

---

### 2. "ANTHROPIC_API_KEY not set" Warning

**Cause:** The backend/.env file is missing or doesn't have your API key.

**Solution:**

**Option A: Create .env file manually**

1. Navigate to the `backend` folder
2. Create a file named `.env` (note the dot at the beginning)
3. Add this content (replace with your actual key):
```
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
PORT=3001
NODE_ENV=development
```

**Option B: Use PowerShell command**
```powershell
# Make sure you're in the project root
# Replace YOUR_KEY with your actual Anthropic API key
$apiKey = "sk-ant-api03-your-actual-key-here"

@"
ANTHROPIC_API_KEY=$apiKey
PORT=3001
NODE_ENV=development
"@ | Out-File -FilePath backend\.env -Encoding utf8
```

**Get your API key:**
1. Go to https://console.anthropic.com/
2. Sign in or create an account
3. Navigate to API Keys
4. Create a new key or copy an existing one
5. It should start with `sk-ant-api03-`

---

### 3. Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000` or `:::3001`

**Solution:**

**Find and kill the process:**

**On Windows PowerShell:**
```powershell
# Find process on port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess

# Kill it (replace PID with actual process ID)
Stop-Process -Id PID

# Or kill both ports
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess
```

---

### 4. Module Not Found Errors

**Error:** `Cannot find module 'react'` or similar

**Solution:**

```powershell
# Clean install all dependencies
Remove-Item node_modules -Recurse -Force
Remove-Item backend\node_modules -Recurse -Force
Remove-Item frontend\node_modules -Recurse -Force

# Reinstall
npm install
cd backend
npm install
cd ..
cd frontend
npm install
cd ..
```

---

### 5. "npm run dev" Not Working

**Solution:**

Run frontend and backend separately:

**Terminal 1 (Backend):**
```powershell
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```

---

## Quick Health Check

Run these commands to verify your setup:

```powershell
# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version

# Check if backend/.env exists
Test-Path backend\.env

# Check if dependencies are installed
Test-Path node_modules
Test-Path backend\node_modules
Test-Path frontend\node_modules
```

---

## Full Reset and Reinstall

If nothing works, try a complete reset:

```powershell
# 1. Stop all running servers (Ctrl+C)

# 2. Clean everything
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item backend\node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item frontend\node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
Remove-Item backend\package-lock.json -ErrorAction SilentlyContinue
Remove-Item frontend\package-lock.json -ErrorAction SilentlyContinue

# 3. Reinstall
npm install
cd backend
npm install
cd ..
cd frontend
npm install
cd ..

# 4. Create .env (with your actual key)
@"
ANTHROPIC_API_KEY=your_actual_key_here
PORT=3001
NODE_ENV=development
"@ | Out-File -FilePath backend\.env -Encoding utf8

# 5. Start servers
npm run dev
```

---

## Still Having Issues?

1. **Check the logs:** Look at the terminal output for specific error messages
2. **Verify Node.js version:** Must be 18 or higher
3. **Check firewall:** Make sure ports 3000 and 3001 aren't blocked
4. **Try a different port:** Edit `backend/.env` and change PORT to 3002
5. **Restart your computer:** Sometimes a fresh start helps

---

## Success Checklist

✅ Node.js 18+ installed
✅ All dependencies installed (root, backend, frontend)
✅ backend/.env file created with valid API key
✅ Both servers running (backend on 3001, frontend on 3000)
✅ Can access http://localhost:3000 in browser
✅ No error messages in terminal

---

## Need More Help?

Check the main README.md or the terminal output for specific error messages.
