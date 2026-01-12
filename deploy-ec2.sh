#!/bin/bash

# SpendLens EC2 Deployment Script
# This script deploys the complete SpendLens application on a fresh EC2 instance
# Tested on: Ubuntu 22.04 LTS, Amazon Linux 2023

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="${DOMAIN:-}"  # Optional: your domain name (e.g., spendlens.example.com)
SSL_EMAIL="${SSL_EMAIL:-}"  # Optional: email for Let's Encrypt
REPOSITORY_URL="https://github.com/akhanna222/personal-spending-model.git"
BRANCH="${BRANCH:-main}"
INSTALL_DIR="/opt/spendlens"
APP_USER="spendlens"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}║           SpendLens EC2 Deployment Script             ║${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print section headers
print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Function to print success messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error messages
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print info messages
print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

print_section "1. System Update and Basic Dependencies"

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    print_info "Detected OS: $OS"
else
    print_error "Cannot detect OS"
    exit 1
fi

# Update system
print_info "Updating system packages..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt-get update -y
    apt-get upgrade -y
    apt-get install -y curl wget git unzip software-properties-common
elif [ "$OS" = "amzn" ] || [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
    yum update -y
    yum install -y curl wget git unzip
else
    print_error "Unsupported OS: $OS"
    exit 1
fi

print_success "System updated"

print_section "2. Install Node.js 20.x"

# Install Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_info "Node.js already installed: $NODE_VERSION"
else
    print_info "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        apt-get install -y nodejs
    else
        yum install -y nodejs
    fi

    print_success "Node.js $(node --version) installed"
fi

# Install npm if not present
if ! command -v npm &> /dev/null; then
    print_error "npm not found, please install manually"
    exit 1
fi

print_success "npm $(npm --version) ready"

print_section "3. Install Docker and Docker Compose"

# Install Docker
if command -v docker &> /dev/null; then
    print_info "Docker already installed: $(docker --version)"
else
    print_info "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    print_success "Docker installed"
fi

# Install Docker Compose
if command -v docker-compose &> /dev/null; then
    print_info "Docker Compose already installed: $(docker-compose --version)"
else
    print_info "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed"
fi

print_section "4. Create Application User"

# Create app user if doesn't exist
if id "$APP_USER" &>/dev/null; then
    print_info "User $APP_USER already exists"
else
    print_info "Creating user $APP_USER..."
    useradd -r -s /bin/bash -d $INSTALL_DIR $APP_USER
    usermod -aG docker $APP_USER
    print_success "User $APP_USER created"
fi

print_section "5. Clone Repository"

# Remove existing directory if present
if [ -d "$INSTALL_DIR" ]; then
    print_info "Removing existing installation..."
    rm -rf $INSTALL_DIR
fi

print_info "Cloning repository..."
git clone -b $BRANCH $REPOSITORY_URL $INSTALL_DIR
cd $INSTALL_DIR
print_success "Repository cloned"

# Set ownership
chown -R $APP_USER:$APP_USER $INSTALL_DIR

print_section "6. Setup Environment Variables"

print_info "Setting up environment variables..."

# Prompt for OpenAI API key
read -p "Enter your OpenAI API Key: " OPENAI_API_KEY
if [ -z "$OPENAI_API_KEY" ]; then
    print_error "OpenAI API Key is required"
    exit 1
fi

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Generate database password
DB_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=')

# Create backend .env file
cat > $INSTALL_DIR/backend/.env << EOF
# OpenAI API Configuration
OPENAI_API_KEY=$OPENAI_API_KEY

# JWT Configuration
JWT_SECRET=$JWT_SECRET

# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=spendlens
DB_USER=spendlens_user
DB_PASSWORD=$DB_PASSWORD
EOF

chown $APP_USER:$APP_USER $INSTALL_DIR/backend/.env
chmod 600 $INSTALL_DIR/backend/.env

print_success "Environment variables configured"

print_section "7. Setup PostgreSQL Database"

print_info "Starting PostgreSQL container..."

# Update docker-compose with generated password
sed -i "s/POSTGRES_PASSWORD: spendlens_password/POSTGRES_PASSWORD: $DB_PASSWORD/" $INSTALL_DIR/docker-compose.yml

# Start PostgreSQL
cd $INSTALL_DIR
docker-compose up -d

# Wait for PostgreSQL to be ready
print_info "Waiting for PostgreSQL to be ready..."
sleep 10

# Check if database is ready
until docker exec spendlens_postgres pg_isready -U spendlens_user -d spendlens > /dev/null 2>&1; do
    echo -n "."
    sleep 2
done
echo ""

print_success "PostgreSQL database ready"

print_section "8. Install Application Dependencies"

print_info "Installing backend dependencies..."
cd $INSTALL_DIR/backend
sudo -u $APP_USER npm install --production

print_info "Installing frontend dependencies..."
cd $INSTALL_DIR/frontend
sudo -u $APP_USER npm install

print_success "Dependencies installed"

print_section "9. Build Frontend"

print_info "Building frontend for production..."
cd $INSTALL_DIR/frontend
sudo -u $APP_USER npm run build

print_success "Frontend built successfully"

print_section "10. Install PM2 for Process Management"

if command -v pm2 &> /dev/null; then
    print_info "PM2 already installed"
else
    print_info "Installing PM2..."
    npm install -g pm2
    print_success "PM2 installed"
fi

# Create PM2 ecosystem file
cat > $INSTALL_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'spendlens-backend',
      cwd: '/opt/spendlens/backend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/opt/spendlens/logs/backend-error.log',
      out_file: '/opt/spendlens/logs/backend-out.log',
      log_file: '/opt/spendlens/logs/backend-combined.log',
      time: true
    }
  ]
};
EOF

chown $APP_USER:$APP_USER $INSTALL_DIR/ecosystem.config.js

# Create logs directory
mkdir -p $INSTALL_DIR/logs
chown -R $APP_USER:$APP_USER $INSTALL_DIR/logs

print_success "PM2 configured"

print_section "11. Install and Configure Nginx"

if command -v nginx &> /dev/null; then
    print_info "Nginx already installed"
else
    print_info "Installing Nginx..."
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        apt-get install -y nginx
    else
        yum install -y nginx
    fi
    systemctl enable nginx
    print_success "Nginx installed"
fi

# Create Nginx configuration
if [ -z "$DOMAIN" ]; then
    print_info "No domain specified, using server IP..."
    SERVER_NAME="_"
else
    print_info "Configuring for domain: $DOMAIN"
    SERVER_NAME="$DOMAIN"
fi

cat > /etc/nginx/sites-available/spendlens << EOF
# Frontend (React app)
server {
    listen 80;
    server_name $SERVER_NAME;

    # Frontend static files
    root /opt/spendlens/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Frontend routes (React Router)
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Increase timeouts for AI processing
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # File upload size limit (50MB)
    client_max_body_size 50M;
}
EOF

# Enable site
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    ln -sf /etc/nginx/sites-available/spendlens /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
else
    ln -sf /etc/nginx/sites-available/spendlens /etc/nginx/conf.d/spendlens.conf
fi

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx

print_success "Nginx configured and started"

print_section "12. Start Application"

print_info "Starting backend with PM2..."
cd $INSTALL_DIR
sudo -u $APP_USER pm2 start ecosystem.config.js
sudo -u $APP_USER pm2 save
pm2 startup systemd -u $APP_USER --hp $INSTALL_DIR

print_success "Application started"

print_section "13. Setup Firewall"

# Configure firewall
if command -v ufw &> /dev/null; then
    print_info "Configuring UFW firewall..."
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo "y" | ufw enable
    print_success "Firewall configured"
else
    print_info "UFW not available, skipping firewall setup"
    print_info "Make sure to configure AWS Security Group to allow:"
    print_info "  - Port 22 (SSH)"
    print_info "  - Port 80 (HTTP)"
    print_info "  - Port 443 (HTTPS)"
fi

print_section "14. SSL Certificate Setup (Optional)"

if [ -n "$DOMAIN" ] && [ -n "$SSL_EMAIL" ]; then
    print_info "Setting up SSL with Let's Encrypt..."

    # Install Certbot
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        apt-get install -y certbot python3-certbot-nginx
    else
        yum install -y certbot python3-certbot-nginx
    fi

    # Obtain certificate
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $SSL_EMAIL

    # Setup auto-renewal
    systemctl enable certbot.timer
    systemctl start certbot.timer

    print_success "SSL certificate installed"
else
    print_info "Skipping SSL setup (no domain or email provided)"
    print_info "To setup SSL later, run:"
    print_info "  sudo certbot --nginx -d your-domain.com -m your-email@example.com"
fi

print_section "15. Deployment Complete!"

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}║              Deployment Successful! 🎉                 ║${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ -n "$DOMAIN" ]; then
    if [ -n "$SSL_EMAIL" ]; then
        echo -e "${GREEN}🌐 Your application is available at:${NC}"
        echo -e "${BLUE}   https://$DOMAIN${NC}"
    else
        echo -e "${GREEN}🌐 Your application is available at:${NC}"
        echo -e "${BLUE}   http://$DOMAIN${NC}"
    fi
else
    echo -e "${GREEN}🌐 Your application is available at:${NC}"
    echo -e "${BLUE}   http://$SERVER_IP${NC}"
fi

echo ""
echo -e "${YELLOW}📋 Important Information:${NC}"
echo ""
echo -e "  ${BLUE}Backend API:${NC}      http://$SERVER_IP/api"
echo -e "  ${BLUE}Health Check:${NC}     http://$SERVER_IP/health"
echo -e "  ${BLUE}Database:${NC}         PostgreSQL on port 5432"
echo -e "  ${BLUE}App Directory:${NC}    $INSTALL_DIR"
echo -e "  ${BLUE}App User:${NC}         $APP_USER"
echo ""
echo -e "${YELLOW}🔐 Credentials (SAVE THESE!):${NC}"
echo ""
echo -e "  ${BLUE}Database Password:${NC}  $DB_PASSWORD"
echo -e "  ${BLUE}JWT Secret:${NC}        $JWT_SECRET"
echo ""
echo -e "${YELLOW}⚙️  Useful Commands:${NC}"
echo ""
echo -e "  ${BLUE}Check backend logs:${NC}      sudo -u $APP_USER pm2 logs spendlens-backend"
echo -e "  ${BLUE}Restart backend:${NC}         sudo -u $APP_USER pm2 restart spendlens-backend"
echo -e "  ${BLUE}Check backend status:${NC}    sudo -u $APP_USER pm2 status"
echo -e "  ${BLUE}Check Nginx status:${NC}      systemctl status nginx"
echo -e "  ${BLUE}Check Nginx logs:${NC}        tail -f /var/log/nginx/error.log"
echo -e "  ${BLUE}Check database:${NC}          docker logs spendlens_postgres"
echo -e "  ${BLUE}Database shell:${NC}          docker exec -it spendlens_postgres psql -U spendlens_user -d spendlens"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo ""
echo "  1. Visit your application and create an account (signup)"
echo "  2. Upload a bank statement to test the Vision API"
echo "  3. Run risk analysis on your transactions"
echo "  4. Configure your domain DNS if you haven't already"
if [ -z "$SSL_EMAIL" ]; then
    echo "  5. Setup SSL certificate with: sudo certbot --nginx -d yourdomain.com"
fi
echo ""
echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
echo ""
