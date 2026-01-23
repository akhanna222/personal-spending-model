# SpendLens EC2 Deployment Guide

Complete guide to deploy SpendLens on AWS EC2 from scratch.

---

## 📋 Prerequisites

Before starting, ensure you have:

1. **AWS Account** with EC2 access
2. **OpenAI API Key** (get one at https://platform.openai.com/api-keys)
3. **Domain Name** (optional, but recommended for SSL)
4. **SSH Key Pair** for EC2 access

---

## 🚀 Quick Deployment (One Command)

```bash
# SSH into your EC2 instance, then run:
curl -fsSL https://raw.githubusercontent.com/akhanna222/personal-spending-model/main/deploy-ec2.sh | sudo bash
```

**OR** clone and run locally:

```bash
git clone https://github.com/akhanna222/personal-spending-model.git
cd personal-spending-model
chmod +x deploy-ec2.sh
sudo ./deploy-ec2.sh
```

---

## 📖 Detailed Step-by-Step Deployment

### Step 1: Launch EC2 Instance

#### 1.1 Create EC2 Instance

Go to AWS Console → EC2 → Launch Instance

**Recommended Configuration:**

| Setting | Value |
|---------|-------|
| **Name** | SpendLens-Production |
| **AMI** | Ubuntu Server 22.04 LTS (64-bit x86) |
| **Instance Type** | t3.medium (2 vCPU, 4GB RAM) minimum |
| **Storage** | 20 GB gp3 |
| **Key Pair** | Create or select existing |

**Why t3.medium?**
- Backend needs memory for AI processing
- Database requires resources
- Frontend build process is memory-intensive

#### 1.2 Configure Security Group

Create/Edit security group with these **Inbound Rules**:

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| SSH | TCP | 22 | Your IP | SSH access |
| HTTP | TCP | 80 | 0.0.0.0/0 | Web traffic |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Secure web traffic |

**⚠️ Security Note:** Restrict SSH (port 22) to your IP address only!

#### 1.3 Launch Instance

Click "Launch Instance" and wait for it to start (status: Running).

---

### Step 2: Connect to EC2 Instance

#### 2.1 Get Connection Details

From EC2 Console, get your instance's:
- **Public IPv4 address** (e.g., 54.123.45.67)
- **Public IPv4 DNS** (e.g., ec2-54-123-45-67.compute-1.amazonaws.com)

#### 2.2 SSH Into Instance

```bash
# Replace with your key file and instance IP
ssh -i /path/to/your-key.pem ubuntu@54.123.45.67
```

**First time connection?** Type `yes` when prompted about fingerprint.

---

### Step 3: Run Deployment Script

#### 3.1 Download and Execute Script

```bash
# Update system first
sudo apt-get update

# Download deployment script
wget https://raw.githubusercontent.com/akhanna222/personal-spending-model/main/deploy-ec2.sh

# Make executable
chmod +x deploy-ec2.sh

# Run deployment
sudo ./deploy-ec2.sh
```

#### 3.2 Provide Configuration During Setup

The script will prompt you for:

1. **OpenAI API Key**: Your OpenAI API key (required)
   ```
   Enter your OpenAI API Key: sk-proj-xxxxxxxxxxxxxxxxxxxxx
   ```

**Optional Environment Variables:**

Set these BEFORE running the script:

```bash
# For custom domain
export DOMAIN="spendlens.yourdomain.com"

# For SSL certificate
export SSL_EMAIL="your-email@example.com"

# For custom branch
export BRANCH="main"

# Then run
sudo -E ./deploy-ec2.sh
```

---

### Step 4: Configure Domain (Optional but Recommended)

#### 4.1 Point Domain to EC2

In your domain registrar (Namecheap, GoDaddy, Route53, etc.):

**Option A: Using A Record**
```
Type: A
Name: spendlens (or @)
Value: 54.123.45.67 (your EC2 IP)
TTL: 300
```

**Option B: Using CNAME (subdomain only)**
```
Type: CNAME
Name: spendlens
Value: ec2-54-123-45-67.compute-1.amazonaws.com
TTL: 300
```

#### 4.2 Wait for DNS Propagation

Check if domain is ready:
```bash
nslookup spendlens.yourdomain.com
```

DNS usually propagates in 5-30 minutes.

---

### Step 5: Setup SSL Certificate (Highly Recommended)

#### 5.1 After Domain is Ready

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d spendlens.yourdomain.com -m your-email@example.com --agree-tos

# Auto-renewal is already configured by Certbot
```

#### 5.2 Verify SSL

Visit: `https://spendlens.yourdomain.com`

Check certificate: Click padlock icon in browser.

---

## 🎉 Post-Deployment

### Access Your Application

- **With Domain + SSL**: `https://spendlens.yourdomain.com`
- **With Domain (HTTP)**: `http://spendlens.yourdomain.com`
- **Direct IP Access**: `http://54.123.45.67`

### Create First User Account

1. Navigate to `/signup`
2. Create account with email/password
3. Login at `/login`
4. Upload your first bank statement!

---

## 🔧 Management Commands

### Application Management

```bash
# Switch to app user
sudo su - spendlens

# Check backend status
pm2 status

# View backend logs
pm2 logs spendlens-backend

# Restart backend
pm2 restart spendlens-backend

# Stop backend
pm2 stop spendlens-backend

# Monitor backend (real-time)
pm2 monit
```

### Nginx Management

```bash
# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Test Nginx config
sudo nginx -t
```

### Database Management

```bash
# Check PostgreSQL container
docker ps | grep postgres

# View database logs
docker logs spendlens_postgres

# Connect to database
docker exec -it spendlens_postgres psql -U spendlens_user -d spendlens

# Backup database
docker exec spendlens_postgres pg_dump -U spendlens_user spendlens > backup.sql

# Restore database
cat backup.sql | docker exec -i spendlens_postgres psql -U spendlens_user -d spendlens

# Stop database
docker-compose -f /opt/spendlens/docker-compose.yml stop

# Start database
docker-compose -f /opt/spendlens/docker-compose.yml up -d
```

### System Monitoring

```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check running processes
ps aux | grep node
ps aux | grep nginx
ps aux | grep docker

# Check open ports
sudo netstat -tulpn
```

---

## 🔄 Updating the Application

### Pull Latest Changes

```bash
# Switch to app directory
cd /opt/spendlens

# Pull latest code
sudo git pull origin main

# Rebuild frontend
cd frontend
sudo npm install
sudo npm run build

# Reinstall backend dependencies
cd ../backend
sudo npm install --production

# Restart backend
sudo -u spendlens pm2 restart spendlens-backend

# Restart Nginx
sudo systemctl restart nginx
```

### Update Script

Create an update script:

```bash
cat > /opt/spendlens/update.sh << 'EOF'
#!/bin/bash
set -e

echo "Updating SpendLens..."

cd /opt/spendlens

# Pull latest code
git pull origin main

# Update frontend
cd frontend
npm install
npm run build

# Update backend
cd ../backend
npm install --production

# Restart services
pm2 restart spendlens-backend
systemctl restart nginx

echo "Update complete!"
EOF

chmod +x /opt/spendlens/update.sh
```

Run update:
```bash
sudo /opt/spendlens/update.sh
```

---

## 🐛 Troubleshooting

### Backend Not Starting

```bash
# Check PM2 logs
sudo -u spendlens pm2 logs spendlens-backend --lines 100

# Common issues:
# 1. OpenAI API key missing or invalid
# 2. Database not running
# 3. Port 3001 already in use

# Check if port is in use
sudo lsof -i :3001

# Restart backend
sudo -u spendlens pm2 restart spendlens-backend
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# If not running, start it
cd /opt/spendlens
docker-compose up -d

# Check database logs
docker logs spendlens_postgres

# Test database connection
docker exec -it spendlens_postgres psql -U spendlens_user -d spendlens -c "SELECT 1;"
```

### Nginx 502 Bad Gateway

```bash
# Check if backend is running
sudo -u spendlens pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Frontend Not Loading

```bash
# Check if frontend was built
ls -la /opt/spendlens/frontend/dist

# If dist folder is empty, rebuild
cd /opt/spendlens/frontend
sudo npm run build

# Check Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal

# Check auto-renewal timer
sudo systemctl status certbot.timer
```

### Out of Memory

```bash
# Check memory usage
free -h

# If low on memory, add swap space
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### High CPU Usage

```bash
# Check processes
top

# If Node.js is using high CPU:
# 1. Check PM2 logs for errors
# 2. Restart backend
sudo -u spendlens pm2 restart spendlens-backend

# Consider upgrading instance type if persistent
```

---

## 🔒 Security Hardening (Recommended)

### 1. Setup Fail2Ban

```bash
# Install Fail2Ban
sudo apt-get install -y fail2ban

# Enable SSH protection
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2. Disable Root Login

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Change these lines:
# PermitRootLogin no
# PasswordAuthentication no

# Restart SSH
sudo systemctl restart sshd
```

### 3. Enable Automatic Updates

```bash
# Install unattended-upgrades
sudo apt-get install -y unattended-upgrades

# Enable automatic updates
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 4. Setup Monitoring

```bash
# Install monitoring tools
sudo apt-get install -y htop iotop iftop

# Setup CloudWatch agent (optional)
# Follow AWS CloudWatch agent setup guide
```

---

## 📊 Performance Optimization

### 1. Enable Nginx Caching

Edit `/etc/nginx/sites-available/spendlens`:

```nginx
# Add inside server block
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 2. Enable PM2 Clustering

Edit `/opt/spendlens/ecosystem.config.js`:

```javascript
instances: 'max',  // Use all CPU cores
exec_mode: 'cluster'
```

### 3. Optimize PostgreSQL

```bash
# Connect to database
docker exec -it spendlens_postgres psql -U spendlens_user -d spendlens

# Run optimization
VACUUM ANALYZE;
REINDEX DATABASE spendlens;
```

---

## 💾 Backup Strategy

### Automated Daily Backups

```bash
# Create backup script
cat > /opt/spendlens/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/spendlens/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker exec spendlens_postgres pg_dump -U spendlens_user spendlens | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup environment files
cp /opt/spendlens/backend/.env $BACKUP_DIR/env_$DATE.backup

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.backup" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/spendlens/backup.sh

# Add to crontab (run daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/spendlens/backup.sh >> /opt/spendlens/logs/backup.log 2>&1") | crontab -
```

---

## 🎯 Cost Optimization

### Instance Cost Estimation

| Instance Type | vCPU | RAM | Price/month* | Recommended For |
|---------------|------|-----|--------------|-----------------|
| t3.small | 2 | 2GB | $15 | Testing only |
| t3.medium | 2 | 4GB | $30 | Small-medium load |
| t3.large | 2 | 8GB | $60 | Medium-high load |
| t3.xlarge | 4 | 16GB | $120 | High load |

*Approximate US East pricing

### Tips to Reduce Costs

1. **Use Reserved Instances** - Save up to 72% with 1-year commitment
2. **Use Spot Instances** - Save up to 90% (non-production only)
3. **Enable Auto-Scaling** - Scale down during off-hours
4. **Use Amazon Lightsail** - Fixed pricing, easier for small apps ($5-20/month)
5. **Optimize Storage** - Delete old backups, logs

---

## 📞 Support

### Get Help

- **GitHub Issues**: https://github.com/akhanna222/personal-spending-model/issues
- **Documentation**: Check README.md
- **Logs**: Always check logs first (PM2, Nginx, Docker)

### Useful Resources

- **PM2 Docs**: https://pm2.keymetrics.io/docs/usage/quick-start/
- **Nginx Docs**: https://nginx.org/en/docs/
- **Docker Docs**: https://docs.docker.com/
- **Let's Encrypt**: https://letsencrypt.org/getting-started/
- **AWS EC2**: https://docs.aws.amazon.com/ec2/

---

## ✅ Deployment Checklist

Use this checklist to ensure everything is configured:

- [ ] EC2 instance launched with correct specs
- [ ] Security group configured (ports 22, 80, 443)
- [ ] SSH access working
- [ ] Domain DNS configured (optional)
- [ ] Deployment script executed successfully
- [ ] OpenAI API key configured
- [ ] Database running and accessible
- [ ] Backend running on PM2
- [ ] Frontend built and served by Nginx
- [ ] SSL certificate installed (if using domain)
- [ ] First user account created
- [ ] Test file upload working
- [ ] Risk analysis functional
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] Security hardening applied

---

## 🎉 You're Done!

Your SpendLens application is now running on EC2!

**Next steps:**
1. Test all features thoroughly
2. Setup monitoring and alerts
3. Configure automated backups
4. Share with your team/users

Happy analyzing! 📊💰
