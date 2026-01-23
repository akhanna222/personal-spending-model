# ⚡ Quick Start - Windows

Get SpendLens running on Windows in 5 minutes using Docker!

## 🎯 Super Fast Setup

### 1. Install Docker Desktop
- Download: https://www.docker.com/products/docker-desktop/
- Install and start Docker Desktop
- Wait for green icon in system tray

### 2. Clone Repository
Open **PowerShell** or **Command Prompt**:
```bash
git clone https://github.com/akhanna222/personal-spending-model.git
cd personal-spending-model
git checkout claude/bank-statement-extraction-pEtji
```

### 3. (Optional) Add OpenAI Key
Create `.env` file:
```bash
notepad .env
```
Add this line:
```
OPENAI_API_KEY=sk-proj-your-key-here
```
Save and close. (Skip this step to run without AI features)

### 4. Start Everything!

**Option A: Double-click the batch file**
- Find `start-windows.bat` in the folder
- Double-click it
- Wait for "Server running" message

**Option B: Use command line**
```bash
docker compose -f docker-compose.dev.yml up --build
```

### 5. Open the App
- Frontend: http://localhost:5173
- Backend: http://localhost:3001/health

**That's it!** 🎉

## 🛑 Stop Everything

**Option A: Double-click**
- Double-click `stop-windows.bat`

**Option B: Command line**
- Press `Ctrl + C` in the terminal
- Then run: `docker compose -f docker-compose.dev.yml down`

## 📝 What Happens Behind the Scenes

The Docker setup automatically:
- ✅ Creates PostgreSQL database
- ✅ Loads database schema
- ✅ Installs all backend dependencies
- ✅ Installs all frontend dependencies
- ✅ Starts backend server
- ✅ Starts frontend server
- ✅ Enables hot reload (code changes auto-refresh)

**No manual setup needed!**

## 🔧 Development

### Edit Code
Use any editor (VS Code, Notepad++, etc.):
- Edit `backend/src/**/*.ts` - Backend auto-reloads
- Edit `frontend/src/**/*.tsx` - Browser auto-refreshes

### View Logs
```bash
docker compose -f docker-compose.dev.yml logs -f
```

### Fresh Start
```bash
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up --build
```

## ❓ Troubleshooting

**Error: "Docker daemon is not running"**
→ Start Docker Desktop from Windows Start Menu

**Error: "port 5173 already in use"**
→ Run `stop-windows.bat` first

**Nothing happens after starting**
→ Wait 1-2 minutes, containers are starting up

**Need more help?**
→ See `WINDOWS-DOCKER-SETUP.md` for detailed guide

## 🎓 Full Documentation

- **Detailed Windows Guide**: `WINDOWS-DOCKER-SETUP.md`
- **Local Setup (No Docker)**: `LOCAL-SETUP.md`
- **Railway Deployment**: `RAILWAY-DEPLOYMENT-CHECKLIST.md`
- **Railway Issues**: `RAILWAY-TROUBLESHOOTING.md`

## 💡 Tips

- First start takes 3-5 minutes (downloads images)
- Subsequent starts take ~30 seconds
- Database data persists between restarts
- Press `Ctrl + C` to stop services
- Use Windows Terminal for better experience
