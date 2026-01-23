# 🐳 Docker Setup for Windows - Super Easy!

This guide helps you run SpendLens on Windows using Docker Desktop. Everything runs in containers - no manual PostgreSQL setup needed!

## Prerequisites

1. **Windows 10/11** (Home, Pro, or Enterprise)
2. **Docker Desktop for Windows** - Download from: https://www.docker.com/products/docker-desktop/
3. **Git for Windows** - Download from: https://git-scm.com/download/win
4. **VS Code** (optional) - Download from: https://code.visualstudio.com/

## Step 1: Install Docker Desktop

1. Download and install Docker Desktop for Windows
2. During installation:
   - Enable WSL 2 if prompted (recommended)
   - Allow Docker to start on boot
3. Start Docker Desktop
4. Wait for Docker to fully start (icon will turn green in system tray)

### Verify Docker is Running

Open **PowerShell** or **Command Prompt**:
```bash
docker --version
docker compose version
```

You should see version numbers like:
```
Docker version 24.0.x
Docker Compose version 2.x.x
```

## Step 2: Clone the Repository

Open **PowerShell** or **Command Prompt**:

```bash
# Navigate to where you want the project
cd C:\Users\YourUsername\Documents

# Clone the repository
git clone https://github.com/akhanna222/personal-spending-model.git

# Switch to the branch
cd personal-spending-model
git checkout claude/bank-statement-extraction-pEtji
```

## Step 3: Create Environment File (Optional)

Create a `.env` file in the project root to add your OpenAI API key:

**Option A: Using Notepad**
```bash
notepad .env
```

Add this content:
```bash
OPENAI_API_KEY=sk-proj-your-key-here
```

**Option B: Skip It**
The app will start without it! You just won't be able to use AI features until you add it later.

## Step 4: Start Everything with One Command! 🚀

In the project folder, run:

```bash
docker compose -f docker-compose.dev.yml up --build
```

This single command will:
- ✅ Start PostgreSQL database
- ✅ Create database schema automatically
- ✅ Install backend dependencies
- ✅ Start backend API on port 3001
- ✅ Install frontend dependencies
- ✅ Start frontend on port 5173
- ✅ Enable hot reload for development

**First time:** Takes ~3-5 minutes (downloads images, installs dependencies)
**Subsequent starts:** Takes ~30 seconds

### What You'll See

```
[+] Running 3/3
 ✔ Container spendlens-db       Started
 ✔ Container spendlens-backend  Started
 ✔ Container spendlens-frontend Started

spendlens-db       | database system is ready to accept connections
spendlens-backend  | 📊 Using individual DB_* environment variables
spendlens-backend  | ✅ Database connected successfully
spendlens-backend  | 🚀 Server running on port 3001
spendlens-frontend | VITE v5.x ready
spendlens-frontend | ➜  Local:   http://localhost:5173/
```

## Step 5: Open the App

**In your browser:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/health

**Expected:**
- ✅ You'll see the SpendLens login/signup page
- ✅ Backend health check returns: `{"status":"ok","timestamp":"..."}`

## Step 6: Use the App

1. Click **"Sign Up"** and create an account
2. Login with your credentials
3. Upload a bank statement (PDF, CSV, or image)
4. View transactions and risk analysis

**Note:** Without `OPENAI_API_KEY`, you'll see an error when uploading files. The app won't crash - it will just tell you to add the API key.

## 🛠️ Common Commands

### Stop Everything
Press `Ctrl + C` in the terminal, then run:
```bash
docker compose -f docker-compose.dev.yml down
```

### Start Again (No Rebuild)
```bash
docker compose -f docker-compose.dev.yml up
```

### Rebuild After Code Changes
```bash
docker compose -f docker-compose.dev.yml up --build
```

### View Logs
```bash
# All services
docker compose -f docker-compose.dev.yml logs

# Just backend
docker compose -f docker-compose.dev.yml logs backend

# Just frontend
docker compose -f docker-compose.dev.yml logs frontend

# Follow logs (live)
docker compose -f docker-compose.dev.yml logs -f
```

### Access Database
```bash
docker exec -it spendlens-db psql -U spendlens_user -d spendlens
```

### Clean Everything (Fresh Start)
```bash
# Stop and remove containers + volumes
docker compose -f docker-compose.dev.yml down -v

# Remove all Docker images
docker system prune -a

# Start fresh
docker compose -f docker-compose.dev.yml up --build
```

## 📝 Editing Code on Windows

### Using VS Code

1. Open the project folder:
   ```bash
   code C:\Users\YourUsername\Documents\personal-spending-model
   ```

2. Install recommended extensions:
   - **Docker** (by Microsoft)
   - **Remote - Containers** (by Microsoft)
   - **ESLint**
   - **Prettier**

3. Edit code normally - Docker volumes auto-sync changes!
   - Edit `backend/src/**` - Backend auto-reloads
   - Edit `frontend/src/**` - Frontend auto-reloads
   - Changes appear instantly in browser

### File Sync

Docker Desktop automatically syncs files between Windows and containers:
- You edit: `C:\Users\...\personal-spending-model\frontend\src\App.tsx`
- Container sees: `/app/frontend/src/App.tsx`
- Vite detects change and hot-reloads

## 🐛 Troubleshooting

### Error: "Docker daemon is not running"
**Solution:** Start Docker Desktop from Windows Start Menu

### Error: "port is already allocated"
**Solution:**
```bash
# Stop containers using the port
docker compose -f docker-compose.dev.yml down

# Or kill the process using the port (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process
```

### Error: "Cannot connect to database"
**Solution:**
```bash
# Check if PostgreSQL container is running
docker ps

# Restart everything
docker compose -f docker-compose.dev.yml restart
```

### Frontend shows blank page
**Solution:**
1. Check if backend is running: http://localhost:3001/health
2. Check frontend logs: `docker compose -f docker-compose.dev.yml logs frontend`
3. Clear browser cache and reload

### Hot reload not working
**Solution:**
```bash
# Restart the specific service
docker compose -f docker-compose.dev.yml restart frontend
```

### "npm install" errors inside container
**Solution:**
```bash
# Rebuild from scratch
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up
```

### Out of disk space
**Solution:**
```bash
# Clean up unused Docker resources
docker system prune -a --volumes

# This removes:
# - Stopped containers
# - Unused networks
# - Unused images
# - Unused volumes
```

## 🔧 Development Workflow

### Making Backend Changes

1. Edit `backend/src/**/*.ts`
2. Save the file
3. Watch terminal - backend auto-reloads via `tsx watch`
4. Test at http://localhost:3001

### Making Frontend Changes

1. Edit `frontend/src/**/*.tsx`
2. Save the file
3. Browser auto-refreshes via Vite HMR
4. See changes instantly at http://localhost:5173

### Adding npm Packages

**Backend:**
```bash
# Stop containers
docker compose -f docker-compose.dev.yml down

# Add package to backend/package.json manually, or:
docker compose -f docker-compose.dev.yml run backend npm install package-name

# Rebuild
docker compose -f docker-compose.dev.yml up --build
```

**Frontend:**
```bash
docker compose -f docker-compose.dev.yml run frontend npm install package-name
docker compose -f docker-compose.dev.yml up --build
```

### Database Migrations

```bash
# Access PostgreSQL
docker exec -it spendlens-db psql -U spendlens_user -d spendlens

# Run SQL commands
\dt  -- List tables
SELECT * FROM users;  -- Query data
\q  -- Exit
```

## 🎯 Benefits of Docker Setup

✅ **No manual PostgreSQL install** - Runs in container
✅ **Identical across Windows/Mac/Linux** - Works everywhere
✅ **Isolated environment** - Doesn't mess with your system
✅ **Easy cleanup** - Delete everything with one command
✅ **Hot reload enabled** - Code changes reflect instantly
✅ **One command to start everything** - No complex setup
✅ **Persistent data** - Database data survives restarts

## 🚀 Next Steps

Once you verify everything works locally:
1. Make code changes and test
2. Commit changes: `git add . && git commit -m "Your changes"`
3. Push to GitHub: `git push origin claude/bank-statement-extraction-pEtji`
4. Railway will auto-deploy (after fixing their cache issue)

## 💡 Pro Tips

### Windows Terminal
Use **Windows Terminal** (free from Microsoft Store) instead of PowerShell for better experience:
- Multiple tabs
- Better colors
- Copy/paste works better

### VS Code Docker Extension
Install Docker extension in VS Code:
- Right-click containers to view logs
- Restart containers from sidebar
- Exec into containers
- View images and volumes

### Performance
For better performance on Windows:
1. Enable WSL 2 backend in Docker Desktop settings
2. Clone repo inside WSL 2 filesystem (optional):
   ```bash
   wsl
   cd ~
   git clone https://github.com/...
   ```

### Checking What's Running
```bash
# List running containers
docker ps

# Check resource usage
docker stats

# View all containers (including stopped)
docker ps -a
```

## 📊 System Requirements

**Minimum:**
- Windows 10 Home (version 2004+) or Windows 11
- 4 GB RAM
- 20 GB free disk space

**Recommended:**
- 8 GB RAM
- 40 GB free disk space
- SSD for faster builds

## ❓ FAQ

**Q: Do I need to install Node.js on Windows?**
A: No! Node.js runs inside Docker containers.

**Q: Do I need to install PostgreSQL on Windows?**
A: No! PostgreSQL runs inside a Docker container.

**Q: Can I use the same database from outside Docker?**
A: Yes! Connect to `localhost:5432` with credentials from docker-compose.dev.yml

**Q: Will this work on Windows Home?**
A: Yes! Docker Desktop works on Windows Home with WSL 2.

**Q: Can I edit files with Notepad++?**
A: Yes! Any editor works. Changes sync automatically.

**Q: How do I add my OpenAI API key later?**
A: Create `.env` file with `OPENAI_API_KEY=sk-...` and restart containers.

**Q: Does this cost money?**
A: No! Docker Desktop is free for personal use. OpenAI API usage costs money.

## 🆘 Still Having Issues?

1. Check Docker Desktop is running (green icon in system tray)
2. Check logs: `docker compose -f docker-compose.dev.yml logs`
3. Try fresh start: `docker compose -f docker-compose.dev.yml down -v && docker compose -f docker-compose.dev.yml up --build`
4. Check firewall isn't blocking Docker
5. Restart Docker Desktop
6. Restart Windows (seriously, sometimes this helps!)
