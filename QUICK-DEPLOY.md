# SpendLens Quick Deploy Reference

Quick reference for deploying and managing SpendLens on EC2.

---

## 🚀 One-Line Deployment

```bash
curl -fsSL https://raw.githubusercontent.com/akhanna222/personal-spending-model/main/deploy-ec2.sh | sudo bash
```

---

## 📋 Pre-Deployment Checklist

### AWS EC2 Setup
```bash
# 1. Launch EC2 instance
#    - AMI: Ubuntu 22.04 LTS
#    - Type: t3.medium (minimum)
#    - Storage: 20GB

# 2. Security Group Rules
#    - SSH (22): Your IP
#    - HTTP (80): 0.0.0.0/0
#    - HTTPS (443): 0.0.0.0/0

# 3. SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip
```

### With Custom Domain & SSL
```bash
# Set environment variables before deploying
export DOMAIN="spendlens.yourdomain.com"
export SSL_EMAIL="your-email@example.com"
export BRANCH="main"  # optional

# Run deployment
sudo -E ./deploy-ec2.sh
```

---

## ⚡ Essential Commands

### Application Management
```bash
# Check status
sudo -u spendlens pm2 status

# View logs (live)
sudo -u spendlens pm2 logs

# Restart backend
sudo -u spendlens pm2 restart spendlens-backend

# Stop backend
sudo -u spendlens pm2 stop spendlens-backend
```

### Database
```bash
# Check database
docker ps | grep postgres

# Database shell
docker exec -it spendlens_postgres psql -U spendlens_user -d spendlens

# Backup
docker exec spendlens_postgres pg_dump -U spendlens_user spendlens > backup.sql

# Restore
cat backup.sql | docker exec -i spendlens_postgres psql -U spendlens_user -d spendlens
```

### Nginx
```bash
# Restart
sudo systemctl restart nginx

# Check config
sudo nginx -t

# Logs
sudo tail -f /var/log/nginx/error.log
```

### Updates
```bash
cd /opt/spendlens
sudo git pull
cd frontend && sudo npm install && sudo npm run build
cd ../backend && sudo npm install --production
sudo -u spendlens pm2 restart all
sudo systemctl restart nginx
```

---

## 🐛 Quick Troubleshooting

### Backend Down
```bash
sudo -u spendlens pm2 logs spendlens-backend
sudo -u spendlens pm2 restart spendlens-backend
```

### Database Not Running
```bash
cd /opt/spendlens
docker-compose up -d
docker logs spendlens_postgres
```

### 502 Bad Gateway
```bash
sudo -u spendlens pm2 status
sudo systemctl restart nginx
```

### Out of Memory
```bash
# Add swap space
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 📁 Important Files

```
/opt/spendlens/                     # Application root
├── backend/
│   ├── .env                        # Backend config (SECRETS!)
│   └── src/
├── frontend/
│   └── dist/                       # Built frontend
├── logs/                           # Application logs
├── docker-compose.yml              # Database config
└── ecosystem.config.js             # PM2 config

/etc/nginx/sites-available/spendlens   # Nginx config
```

---

## 🔐 Security

### View Credentials
```bash
# Database password
grep DB_PASSWORD /opt/spendlens/backend/.env

# JWT secret
grep JWT_SECRET /opt/spendlens/backend/.env

# OpenAI API key
grep OPENAI_API_KEY /opt/spendlens/backend/.env
```

### Change Database Password
```bash
# 1. Generate new password
NEW_PASS=$(openssl rand -base64 16)

# 2. Update .env
sudo nano /opt/spendlens/backend/.env
# Change DB_PASSWORD=new_password

# 3. Update docker-compose
sudo nano /opt/spendlens/docker-compose.yml
# Change POSTGRES_PASSWORD: new_password

# 4. Restart everything
cd /opt/spendlens
docker-compose down
docker-compose up -d
sudo -u spendlens pm2 restart all
```

---

## 📊 Monitoring

### Check Resource Usage
```bash
# Memory
free -h

# Disk
df -h

# CPU
top

# Network
sudo netstat -tulpn
```

### Check Application Health
```bash
# Health endpoint
curl http://localhost:3001/health

# Backend status
sudo -u spendlens pm2 status

# Database status
docker ps | grep postgres

# Nginx status
sudo systemctl status nginx
```

---

## 💾 Backup & Restore

### Quick Backup
```bash
# Database
docker exec spendlens_postgres pg_dump -U spendlens_user spendlens | gzip > backup_$(date +%Y%m%d).sql.gz

# Environment
cp /opt/spendlens/backend/.env backup_env_$(date +%Y%m%d).txt
```

### Quick Restore
```bash
# Database
gunzip < backup_20240115.sql.gz | docker exec -i spendlens_postgres psql -U spendlens_user -d spendlens
```

---

## 🔧 Performance Tuning

### Enable PM2 Clustering
```bash
sudo nano /opt/spendlens/ecosystem.config.js
# Change: instances: 'max', exec_mode: 'cluster'
sudo -u spendlens pm2 restart all
```

### Optimize Database
```bash
docker exec -it spendlens_postgres psql -U spendlens_user -d spendlens -c "VACUUM ANALYZE;"
```

---

## 📞 Need Help?

- **Logs**: `/opt/spendlens/logs/`
- **Issues**: https://github.com/akhanna222/personal-spending-model/issues
- **Docs**: See DEPLOYMENT.md for full guide

---

## 🎯 Common URLs

- **Application**: `http://your-ip` or `https://your-domain.com`
- **API**: `http://your-ip/api`
- **Health**: `http://your-ip/health`
- **Signup**: `http://your-ip/signup`
- **Login**: `http://your-ip/login`

---

**Pro Tip:** Bookmark this page for quick reference! 📖
