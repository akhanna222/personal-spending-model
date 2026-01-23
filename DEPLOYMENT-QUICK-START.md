# 🚀 Deployment Quick Start

Choose your deployment method and get SpendLens running in **5 minutes**!

---

## ⚡ Option 1: Railway (RECOMMENDED - Easiest!)

**Perfect for**: Most users, fastest setup, best free tier

### 3 Steps to Deploy:

1. **Go to Railway**: https://railway.app
2. **Click "New Project"** → "Deploy from GitHub"
3. **Select repo**: `akhanna222/personal-spending-model` (branch: `claude/bank-statement-extraction-pEtji`)

That's it! Railway will:
- ✅ Auto-detect configuration from `railway.toml`
- ✅ Create PostgreSQL database
- ✅ Build and deploy backend
- ✅ Provide a public URL

### Add Environment Variables:

In Railway dashboard, add:
- `OPENAI_API_KEY` = Your OpenAI API key
- Other variables are auto-configured from PostgreSQL

**Cost**: FREE (500 hours/month) → then $5/month

**URL**: You get a URL like `https://your-app.up.railway.app`

---

## ⚡ Option 2: Render

**Perfect for**: Alternative to Railway, good free tier

### 3 Steps to Deploy:

1. **Go to Render**: https://render.com
2. **New Blueprint** → Connect GitHub repo
3. **Select** `render.yaml` blueprint

Render will automatically:
- ✅ Create PostgreSQL database
- ✅ Deploy backend service
- ✅ Deploy frontend static site
- ✅ Connect everything

### Add Environment Variable:

- `OPENAI_API_KEY` = Your OpenAI API key

**Cost**: FREE (750 hours/month, spins down after 15 min) → then $7/month

**URLs**:
- Frontend: `https://spendlens-frontend.onrender.com`
- Backend: `https://spendlens-backend.onrender.com`

---

## ⚡ Option 3: Docker (Any Server)

**Perfect for**: Full control, any VPS (DigitalOcean, Linode, Hetzner)

### Quick Deploy (One Command):

```bash
# Clone repo
git clone https://github.com/akhanna222/personal-spending-model.git
cd personal-spending-model
git checkout claude/bank-statement-extraction-pEtji

# Run deployment script
chmod +x quick-deploy.sh
./quick-deploy.sh
```

The script will:
- ✅ Check Docker installation
- ✅ Create `.env` from template
- ✅ Start all services (PostgreSQL, Backend, Frontend)
- ✅ Setup database schema

**Manual Deploy**:

```bash
# 1. Create .env file
cp .env.example .env
nano .env  # Add your API keys

# 2. Deploy
docker-compose -f docker-compose.production.yml up -d

# 3. Setup database
docker exec -i spendlens-postgres psql -U spendlens_user -d spendlens < backend/schema.sql

# 4. Access
open http://your-server-ip
```

**Cost**: $5-10/month (depends on VPS provider)

**Management**:
```bash
# View logs
docker-compose -f docker-compose.production.yml logs -f

# Stop
docker-compose -f docker-compose.production.yml down

# Restart
docker-compose -f docker-compose.production.yml restart
```

---

## 📊 Quick Comparison

| Feature | Railway | Render | Docker |
|---------|---------|--------|--------|
| **Setup Time** | 5 min | 5 min | 10 min |
| **Free Tier** | 500h/month | 750h/month | N/A |
| **PostgreSQL** | ✅ Included | ✅ Included | ✅ Included |
| **Auto-deploy** | ✅ On git push | ✅ On git push | ❌ Manual |
| **SSL/HTTPS** | ✅ Auto | ✅ Auto | ⚠️ Manual |
| **Paid Plan** | $5/month | $7/month | $5-10/month |
| **Best For** | Beginners | Alternatives | Advanced |

---

## 🔑 Required Environment Variables

All deployments need:

```bash
OPENAI_API_KEY=sk-proj-your-key-here
DB_PASSWORD=your-secure-password
JWT_SECRET=your-random-secret
```

**Get OpenAI Key**: https://platform.openai.com/api-keys

**Generate JWT Secret**:
```bash
openssl rand -hex 32
```

---

## ✅ After Deployment Checklist

1. **Access the app** at your deployment URL
2. **Sign up** for a new account
3. **Upload** a bank statement (PDF or CSV)
4. **Verify** transactions are extracted
5. **Check** risk analysis works

---

## 🆘 Troubleshooting

### "OpenAI API Key is required"

✅ **Fix**: Add `OPENAI_API_KEY` to environment variables in your platform

### "Database connection failed"

✅ **Fix**:
- Railway/Render: Check database is created
- Docker: Run `docker-compose ps` to check postgres is running

### Frontend shows blank page

✅ **Fix**:
- Check browser console for errors
- Verify `VITE_API_URL` points to backend
- Check CORS settings in backend

### 502 Bad Gateway

✅ **Fix**:
- Check backend is running: `curl https://your-backend/health`
- Check logs for errors
- Verify database connection

---

## 💡 Pro Tips

1. **Railway** → Best for most users (easiest + best free tier)
2. **Render** → Good if Railway limits don't work for you
3. **Docker** → Use if you need full control or have existing VPS

---

## 📚 Full Documentation

- **Complete Guide**: See `EASY-DEPLOYMENT.md`
- **Docker Details**: See `docker-compose.production.yml`
- **Railway Config**: See `railway.toml`
- **Render Config**: See `render.yaml`

---

## 🎯 Recommended: Railway

**Why?**
- ✅ Fastest setup (literally 5 minutes)
- ✅ Best free tier (500 hours = ~20 days)
- ✅ Auto-deploys on git push
- ✅ Built-in monitoring
- ✅ PostgreSQL included
- ✅ Never sleeps (unlike Render free tier)

**Just do this**:
1. Go to https://railway.app
2. Sign in with GitHub
3. "New Project" → "Deploy from GitHub" → Select repo
4. Add `OPENAI_API_KEY` in Variables
5. Done! 🎉

---

*Questions? Check `EASY-DEPLOYMENT.md` for detailed guides!*
