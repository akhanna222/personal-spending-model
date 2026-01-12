# SpendLens EC2 Deployment - Exact Commands

## ✅ Current Branch
**Branch Name:** `claude/bank-statement-extraction-pEtji`

This branch contains:
- ✅ Complete authentication system (JWT + bcrypt)
- ✅ PostgreSQL database integration
- ✅ All frontend pages (Login, Signup, Upload, Transactions, Statements, Risks, Insights, Settings)
- ✅ UI/UX improvements (toast notifications, modern components)
- ✅ Automated deployment script

---

## 🚀 Deployment Method 1: One-Line Command (Recommended)

### Step 1: SSH into EC2
```bash
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_IP
```

### Step 2: Run Deployment Script
```bash
curl -fsSL https://raw.githubusercontent.com/akhanna222/personal-spending-model/claude/bank-statement-extraction-pEtji/deploy-ec2.sh | sudo bash
```

**That's it!** The script will:
1. Ask for your OpenAI API key
2. Auto-install everything
3. Deploy the app at `http://YOUR_EC2_IP`

---

## 🚀 Deployment Method 2: Manual Clone + Run

### Step 1: SSH into EC2
```bash
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_IP
```

### Step 2: Clone Repository
```bash
# Clone the repository
git clone -b claude/bank-statement-extraction-pEtji https://github.com/akhanna222/personal-spending-model.git

# Enter directory
cd personal-spending-model

# Make script executable
chmod +x deploy-ec2.sh
```

### Step 3: Run Deployment
```bash
sudo ./deploy-ec2.sh
```

### Step 4: Enter API Key When Prompted
```
Enter your OpenAI API Key: sk-proj-xxxxxxxxxxxxxxxxxxxxx
```

---

## 🌐 With Custom Domain + SSL

### Before Running Script:
```bash
# SSH into EC2
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_IP

# Set environment variables
export DOMAIN="spendlens.yourdomain.com"
export SSL_EMAIL="your-email@example.com"

# Run deployment with environment variables
curl -fsSL https://raw.githubusercontent.com/akhanna222/personal-spending-model/claude/bank-statement-extraction-pEtji/deploy-ec2.sh | sudo -E bash
```

---

## 📋 Pre-Deployment Checklist

### 1. Launch EC2 Instance

**Recommended Specs:**
- **AMI:** Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
- **Instance Type:** t3.medium (2 vCPU, 4GB RAM) - Minimum
- **Storage:** 20 GB gp3
- **Key Pair:** Create new or use existing

### 2. Configure Security Group

**Inbound Rules:**
```
Type: SSH       | Port: 22  | Source: Your IP (e.g., 1.2.3.4/32)
Type: HTTP      | Port: 80  | Source: 0.0.0.0/0
Type: HTTPS     | Port: 443 | Source: 0.0.0.0/0
```

### 3. Get Your OpenAI API Key
- Go to: https://platform.openai.com/api-keys
- Create new API key
- Copy it (you'll need it during deployment)

---

## 📝 Complete Deployment Example

```bash
# ============================================
# STEP 1: SSH into your EC2 instance
# ============================================
ssh -i ~/keys/my-ec2-key.pem ubuntu@54.123.45.67

# ============================================
# STEP 2: Run deployment script
# ============================================
curl -fsSL https://raw.githubusercontent.com/akhanna222/personal-spending-model/claude/bank-statement-extraction-pEtji/deploy-ec2.sh | sudo bash

# ============================================
# STEP 3: When prompted, enter your OpenAI API key
# ============================================
# Enter your OpenAI API Key: sk-proj-abcd1234...

# ============================================
# STEP 4: Wait for deployment (5-10 minutes)
# ============================================
# Script will show progress with ✓ checkmarks

# ============================================
# STEP 5: Access your application
# ============================================
# Visit: http://54.123.45.67
# Signup at: http://54.123.45.67/signup
```

---

## 🎯 After Deployment

### 1. Access Application
```
Application URL: http://YOUR_EC2_IP
Signup Page:     http://YOUR_EC2_IP/signup
Login Page:      http://YOUR_EC2_IP/login
API Health:      http://YOUR_EC2_IP/health
```

### 2. Create First User Account
1. Navigate to `/signup`
2. Enter email and password (min 8 characters)
3. Click "Create account"
4. Login with your credentials

### 3. Test Upload
1. Upload a bank statement (PDF/CSV/image)
2. View extracted transactions
3. Run risk analysis
4. Check insights

---

## 🔧 Management Commands (After Deployment)

### Check Application Status
```bash
# SSH into EC2
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_IP

# Switch to app user
sudo su - spendlens

# Check backend status
pm2 status

# View logs
pm2 logs spendlens-backend

# Exit app user
exit
```

### Check Database
```bash
# Check if database is running
docker ps | grep postgres

# View database logs
docker logs spendlens_postgres

# Connect to database shell
docker exec -it spendlens_postgres psql -U spendlens_user -d spendlens
```

### Restart Services
```bash
# Restart backend
sudo -u spendlens pm2 restart spendlens-backend

# Restart Nginx
sudo systemctl restart nginx

# Restart database
cd /opt/spendlens
docker-compose restart
```

---

## 🐛 Troubleshooting

### If Deployment Fails

**1. Check if running as root:**
```bash
sudo su
./deploy-ec2.sh
```

**2. Check instance has internet access:**
```bash
ping google.com
curl -I https://github.com
```

**3. Check logs:**
```bash
# System logs
sudo journalctl -xe

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# PM2 logs (after deployment)
sudo -u spendlens pm2 logs
```

### Common Issues

**Port 80 already in use:**
```bash
# Kill apache2 if installed
sudo systemctl stop apache2
sudo systemctl disable apache2
```

**Cannot connect to EC2:**
```bash
# Check security group allows SSH from your IP
# Check key permissions
chmod 400 /path/to/your-key.pem
```

**502 Bad Gateway:**
```bash
# Backend not running, check PM2
sudo -u spendlens pm2 status
sudo -u spendlens pm2 restart all
```

---

## 💡 Pro Tips

### 1. Use Elastic IP
Allocate an Elastic IP to keep same IP address even if instance restarts:
```
EC2 Console → Elastic IPs → Allocate → Associate with instance
```

### 2. Setup Domain DNS
Point your domain A record to EC2 IP:
```
Type: A
Name: spendlens
Value: 54.123.45.67
TTL: 300
```

### 3. Enable Automatic Backups
```bash
# SSH into EC2
ssh -i key.pem ubuntu@YOUR_EC2_IP

# Create backup script (already included in deployment)
sudo -u spendlens crontab -l
```

### 4. Monitor Resources
```bash
# CPU and memory
htop

# Disk usage
df -h

# Check application health
curl http://localhost:3001/health
```

---

## 📞 Need Help?

**Logs Location:**
- Application: `/opt/spendlens/logs/`
- Nginx: `/var/log/nginx/`
- PM2: `sudo -u spendlens pm2 logs`
- Database: `docker logs spendlens_postgres`

**Configuration Files:**
- Backend .env: `/opt/spendlens/backend/.env`
- Nginx config: `/etc/nginx/sites-available/spendlens`
- PM2 config: `/opt/spendlens/ecosystem.config.js`
- Docker config: `/opt/spendlens/docker-compose.yml`

**Useful Links:**
- Repository: https://github.com/akhanna222/personal-spending-model
- Issues: https://github.com/akhanna222/personal-spending-model/issues
- Full Docs: See DEPLOYMENT.md in repository

---

## ✅ Quick Verification Checklist

After deployment, verify:

- [ ] Can access `http://YOUR_EC2_IP` (shows login/signup page)
- [ ] Can create account at `/signup`
- [ ] Can login at `/login`
- [ ] Can upload bank statement
- [ ] Transactions appear in table
- [ ] Risk analysis works
- [ ] Backend API responds: `curl http://localhost:3001/health`
- [ ] Database running: `docker ps | grep postgres`
- [ ] PM2 running: `sudo -u spendlens pm2 status`
- [ ] Nginx running: `sudo systemctl status nginx`

---

## 🎉 You're All Set!

Your SpendLens application is now running on EC2 with:
- ✅ Complete authentication system
- ✅ PostgreSQL database
- ✅ AI-powered bank statement analysis
- ✅ Risk detection and insights
- ✅ Production-ready infrastructure
- ✅ Automatic process management
- ✅ Reverse proxy with Nginx

**Start using SpendLens at:** `http://YOUR_EC2_IP/signup`
