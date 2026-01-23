# 🚀 Easy Deployment Guide

Deploy SpendLens in **5 minutes** using these platforms - no AWS EC2 complexity needed!

---

## 📋 Quick Comparison

| Platform | Difficulty | Free Tier | PostgreSQL | Best For |
|----------|------------|-----------|------------|----------|
| **Railway** | ⭐ Easiest | Yes (500h) | ✅ Included | **Recommended** |
| **Render** | ⭐⭐ Easy | Yes | ✅ Included | Good alternative |
| **Docker** | ⭐⭐⭐ Medium | N/A | ✅ Included | Any VPS/server |
| **Vercel** | ⭐ Easiest | Yes | ❌ External | Frontend only |

---

## 🎯 Method 1: Railway (RECOMMENDED - Easiest!)

**Free Tier**: 500 hours/month, PostgreSQL included

### Step 1: Prepare Repository

```bash
# Make sure latest code is pushed
git add .
git commit -m "Prepare for Railway deployment"
git push origin claude/bank-statement-extraction-pEtji
```

### Step 2: Deploy to Railway

1. **Sign up**: Go to [railway.app](https://railway.app) and sign in with GitHub
2. **New Project**: Click "New Project"
3. **Deploy from GitHub**:
   - Select your repository: `akhanna222/personal-spending-model`
   - Select branch: `claude/bank-statement-extraction-pEtji`
4. **Add PostgreSQL** (REQUIRED):
   - Click "+ New"
   - Select "Database" → "PostgreSQL"
   - Railway automatically sets DATABASE_URL for you!
5. **Configure Backend**:
   - Click on your service
   - Go to "Variables"
   - Add these environment variables:
     ```
     OPENAI_API_KEY=sk-proj-your-key-here
     JWT_SECRET=your-random-secret-here
     NODE_ENV=production
     PORT=3001
     ```
   - **Note**: DATABASE_URL is automatically set by the PostgreSQL plugin
6. **Deploy**: Railway will automatically build and deploy!

### Step 3: Setup Database Schema

1. Go to PostgreSQL service → "Data" tab
2. Click "Query" and run the contents of `backend/schema.sql`

### Step 4: Access Your App

- Railway will give you a URL like: `https://your-app.up.railway.app`
- Done! 🎉

**Cost**: Free for 500 hours/month (covers ~20 days of continuous running)

---

## 🎯 Method 2: Render

**Free Tier**: 750 hours/month, PostgreSQL included

### Step 1: Prepare Repository

Same as Railway (ensure code is pushed to GitHub)

### Step 2: Deploy to Render

1. **Sign up**: Go to [render.com](https://render.com) and sign in with GitHub
2. **New Blueprint**: Click "New +" → "Blueprint"
3. **Connect Repository**:
   - Select `akhanna222/personal-spending-model`
   - Branch: `claude/bank-statement-extraction-pEtji`
4. **Auto-detect Configuration**: Render will detect `render.yaml`
5. **Add Environment Variables**:
   - Go to your backend service
   - Add `OPENAI_API_KEY` in Environment Variables
6. **Deploy**: Click "Apply"

Render will:
- ✅ Create PostgreSQL database
- ✅ Build backend
- ✅ Build frontend
- ✅ Connect everything automatically

### Step 3: Access Your App

- Frontend: `https://spendlens-frontend.onrender.com`
- Backend: `https://spendlens-backend.onrender.com`
- Done! 🎉

**Cost**: Free tier (spins down after 15 mins of inactivity)

---

## 🎯 Method 3: Docker Compose (Any Server)

**Use this for**: DigitalOcean, Linode, Hetzner, or any VPS

### Step 1: Clone Repository on Server

```bash
ssh user@your-server-ip
git clone https://github.com/akhanna222/personal-spending-model.git
cd personal-spending-model
git checkout claude/bank-statement-extraction-pEtji
```

### Step 2: Configure Environment

```bash
# Create .env file
cat > .env << 'EOF'
DB_NAME=spendlens
DB_USER=spendlens_user
DB_PASSWORD=your-secure-password-here
OPENAI_API_KEY=sk-proj-your-key-here
JWT_SECRET=your-random-secret-here
EOF
```

### Step 3: Deploy with Docker Compose

```bash
# Install Docker (if not installed)
curl -fsSL https://get.docker.com | sh

# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### Step 4: Setup Database Schema

```bash
# Copy schema to container and execute
docker exec -i spendlens-postgres psql -U spendlens_user -d spendlens < backend/schema.sql
```

### Step 5: Access Your App

- Open browser: `http://your-server-ip`
- Done! 🎉

**Management Commands**:
```bash
# Stop services
docker-compose -f docker-compose.production.yml down

# Restart
docker-compose -f docker-compose.production.yml restart

# Update to latest code
git pull
docker-compose -f docker-compose.production.yml up -d --build

# Backup database
docker exec spendlens-postgres pg_dump -U spendlens_user spendlens > backup.sql
```

**Cost**: Depends on VPS provider ($5-10/month)

---

## 🎯 Method 4: Vercel + External Database

**Best for**: Frontend-only deployment (need external database)

### Step 1: Setup External Database

Use one of these free PostgreSQL providers:
- **Neon**: [neon.tech](https://neon.tech) - Free tier with 10GB
- **Supabase**: [supabase.com](https://supabase.com) - Free tier
- **ElephantSQL**: [elephantsql.com](https://elephantsql.com) - Free 20MB

### Step 2: Deploy Backend to Railway/Render

Follow Method 1 or 2 for backend only

### Step 3: Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel

# Follow prompts:
# - Link to existing project: No
# - Project name: spendlens
# - Directory: ./
# - Build command: npm run build
# - Output directory: dist
```

### Step 4: Configure Environment

In Vercel dashboard:
- Settings → Environment Variables
- Add `VITE_API_URL` pointing to your backend (Railway/Render URL)

**Cost**: Free!

---

## 📊 Comparison Details

### Railway (⭐ Recommended)

**Pros**:
- ✅ Easiest setup (5 minutes)
- ✅ Automatic PostgreSQL
- ✅ Great free tier (500h/month)
- ✅ Auto-deploy on git push
- ✅ Built-in monitoring

**Cons**:
- ❌ Limited to 500 hours/month on free tier
- ❌ Sleeps after inactivity (but wakes instantly)

**Best for**: Most users, startups, side projects

---

### Render

**Pros**:
- ✅ Very easy setup
- ✅ 750 hours/month free
- ✅ Auto-deploy from git
- ✅ Good documentation

**Cons**:
- ❌ Free tier spins down after 15 mins inactivity
- ❌ Slower cold starts (15-30 seconds)

**Best for**: Projects with intermittent traffic

---

### Docker Compose

**Pros**:
- ✅ Full control
- ✅ Works on any server
- ✅ No platform lock-in
- ✅ Predictable costs

**Cons**:
- ❌ Requires server management
- ❌ Need to setup SSL manually
- ❌ No auto-scaling

**Best for**: Production deployments, experienced users

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Use strong `JWT_SECRET` (generate with `openssl rand -hex 32`)
- [ ] Keep `OPENAI_API_KEY` secure
- [ ] Enable HTTPS (Railway/Render do this automatically)
- [ ] Set up database backups
- [ ] Review CORS settings in backend

---

## 🐛 Troubleshooting

### "Database connection failed"

**Check**:
```bash
# On Railway/Render: Check environment variables
# On Docker: Check if postgres container is running
docker-compose ps
```

### "OpenAI API Key is required"

**Fix**: Add `OPENAI_API_KEY` to environment variables

### "502 Bad Gateway"

**Check**:
- Backend is running
- Backend is accessible on correct port
- Health endpoint works: `curl https://your-backend/health`

### Frontend can't connect to backend

**Fix**:
- Update `VITE_API_URL` in frontend environment
- Check CORS settings in backend

---

## 📱 After Deployment

1. **Test the app**:
   - Sign up for a new account
   - Upload a bank statement
   - Verify transactions appear
   - Check risk analysis works

2. **Monitor**:
   - Railway: Built-in metrics dashboard
   - Render: Logs in dashboard
   - Docker: `docker-compose logs -f`

3. **Update**:
   - Railway/Render: Just push to git → auto-deploys
   - Docker: `git pull && docker-compose up -d --build`

---

## 💰 Pricing Summary

| Platform | Free Tier | Paid Plans Start At |
|----------|-----------|---------------------|
| Railway | 500h/month | $5/month |
| Render | 750h/month | $7/month |
| Vercel | Unlimited | $20/month (Pro) |
| DigitalOcean | N/A | $6/month |
| Hetzner | N/A | €4.5/month (~$5) |

---

## 🎉 Recommended Setup

**For most users**:
1. Deploy to **Railway** (easiest, free)
2. If you need more hours → upgrade to Railway paid ($5/month)
3. If you need full control → Docker on DigitalOcean ($6/month)

**For production with high traffic**:
- Backend: Railway/Render (paid tier)
- Frontend: Vercel (edge network)
- Database: Neon/Supabase (managed PostgreSQL)

---

## 🆘 Need Help?

- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Docker Docs: https://docs.docker.com

---

**Ready to deploy?** Start with Railway - it's the easiest! 🚀
