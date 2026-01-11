#!/bin/bash

# SpendLens Dynamic Startup Script
# Handles port cleanup, API key management, and automatic startup

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=3001
FRONTEND_PORT=3000
ENV_FILE="backend/.env"

echo ""
echo -e "${PURPLE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║           🏦 SpendLens Bank Statement Extraction          ║${NC}"
echo -e "${PURPLE}║              Zero Regex • Vision-First • Fast             ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to kill process on port
kill_port() {
    local port=$1
    echo -e "${YELLOW}🔍 Checking port $port...${NC}"

    # Find and kill process on port
    local pid=$(lsof -ti:$port 2>/dev/null)

    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}⚠️  Port $port is in use by process $pid${NC}"
        echo -e "${YELLOW}🔪 Killing process...${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✅ Port $port freed${NC}"
    else
        echo -e "${GREEN}✅ Port $port is available${NC}"
    fi
}

# Function to check and install dependencies
check_dependencies() {
    echo ""
    echo -e "${BLUE}📦 Checking dependencies...${NC}"

    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        echo "Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi

    local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        echo -e "${RED}❌ Node.js version 18+ required (you have v$node_version)${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ npm $(npm -v)${NC}"

    # Install backend dependencies
    if [ ! -d "backend/node_modules" ]; then
        echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
        cd backend
        npm install --silent
        cd ..
        echo -e "${GREEN}✅ Backend dependencies installed${NC}"
    else
        echo -e "${GREEN}✅ Backend dependencies already installed${NC}"
    fi
}

# Function to setup database
setup_database() {
    echo ""
    echo -e "${BLUE}🗄️  Database Setup${NC}"
    echo ""

    # Check if database is already running
    if docker ps | grep -q spendlens_postgres; then
        echo -e "${GREEN}✅ PostgreSQL database is already running${NC}"
        return 0
    fi

    echo -e "${CYAN}Setting up PostgreSQL database with Docker...${NC}"
    echo ""

    # Run database setup script
    if [ -f "./setup-database.sh" ]; then
        chmod +x ./setup-database.sh
        ./setup-database.sh
    else
        echo -e "${YELLOW}⚠️  setup-database.sh not found. Skipping database setup.${NC}"
        echo -e "${YELLOW}   Note: You'll need to set up PostgreSQL manually.${NC}"
        echo ""
    fi
}

# Function to get or create OpenAI API key
setup_api_key() {
    echo ""
    echo -e "${CYAN}🔑 OpenAI API Key Setup${NC}"
    echo ""

    # Check if .env exists and has API key
    if [ -f "$ENV_FILE" ]; then
        source "$ENV_FILE" 2>/dev/null || true
        if [ ! -z "$OPENAI_API_KEY" ]; then
            local masked_key="${OPENAI_API_KEY:0:7}...${OPENAI_API_KEY: -4}"
            echo -e "${GREEN}✅ Found existing API key: $masked_key${NC}"
            echo ""
            read -p "Use this key? (y/n) [y]: " use_existing
            use_existing=${use_existing:-y}

            if [ "$use_existing" = "y" ] || [ "$use_existing" = "Y" ]; then
                export OPENAI_API_KEY
                return 0
            fi
        fi
    fi

    # Prompt for new API key
    echo "Get your API key at: ${CYAN}https://platform.openai.com/api-keys${NC}"
    echo ""
    read -p "Enter your OpenAI API key: " new_api_key

    if [ -z "$new_api_key" ]; then
        echo -e "${RED}❌ API key cannot be empty${NC}"
        exit 1
    fi

    # Validate key format (basic check)
    if [[ ! $new_api_key =~ ^sk-[a-zA-Z0-9]{20,} ]]; then
        echo -e "${YELLOW}⚠️  Warning: API key format looks unusual${NC}"
        read -p "Continue anyway? (y/n) [n]: " continue_anyway
        if [ "$continue_anyway" != "y" ] && [ "$continue_anyway" != "Y" ]; then
            exit 1
        fi
    fi

    # Generate JWT secret if not exists
    if [ -f "$ENV_FILE" ] && grep -q "JWT_SECRET" "$ENV_FILE"; then
        # JWT secret already exists, preserve it
        local jwt_secret=$(grep JWT_SECRET "$ENV_FILE" | cut -d'=' -f2)
    else
        # Generate new JWT secret
        jwt_secret=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    fi

    # Create or update .env file
    mkdir -p backend
    cat > "$ENV_FILE" << EOF
# OpenAI API Configuration
OPENAI_API_KEY=$new_api_key

# JWT Configuration
JWT_SECRET=$jwt_secret

# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=spendlens
DB_USER=spendlens_user
DB_PASSWORD=spendlens_password

# Created/Updated by start script on $(date)
EOF

    chmod 600 "$ENV_FILE"  # Secure the file
    export OPENAI_API_KEY=$new_api_key

    echo ""
    echo -e "${GREEN}✅ Configuration saved to $ENV_FILE${NC}"
    echo -e "${YELLOW}🔒 File permissions set to 600 (secure)${NC}"
}

# Function to choose version
choose_version() {
    echo ""
    echo -e "${PURPLE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                    Choose Version                          ║${NC}"
    echo -e "${PURPLE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}1)${NC} 🔮 ${CYAN}VISION${NC} (Recommended)"
    echo "   • Zero regex patterns"
    echo "   • GPT-4o Vision reads images directly"
    echo "   • 90x faster for images (3s vs 275s)"
    echo "   • 95% accuracy, 50-80% cheaper"
    echo "   • Single AI call per file"
    echo ""
    echo -e "${GREEN}2)${NC} ⚡ ${CYAN}OPTIMIZED${NC}"
    echo "   • Batch processing (10 txns per call)"
    echo "   • Function calling for structured output"
    echo "   • 10x faster than original"
    echo "   • 5x cheaper"
    echo ""
    echo -e "${GREEN}3)${NC} 📝 ${CYAN}ORIGINAL${NC}"
    echo "   • Standard approach"
    echo "   • Backward compatible"
    echo "   • 2 AI calls per transaction"
    echo ""

    read -p "Enter choice [1-3] (default: 1): " choice
    choice=${choice:-1}

    case $choice in
        1)
            VERSION="vision"
            VERSION_NAME="🔮 VISION"
            ROUTES_FILE="routes.vision"
            ;;
        2)
            VERSION="optimized"
            VERSION_NAME="⚡ OPTIMIZED"
            ROUTES_FILE="routes.optimized"
            ;;
        3)
            VERSION="original"
            VERSION_NAME="📝 ORIGINAL"
            ROUTES_FILE="routes"
            ;;
        *)
            echo -e "${YELLOW}Invalid choice. Using VISION (recommended)${NC}"
            VERSION="vision"
            VERSION_NAME="🔮 VISION"
            ROUTES_FILE="routes.vision"
            ;;
    esac

    echo ""
    echo -e "${GREEN}✅ Selected: $VERSION_NAME${NC}"
}

# Function to configure routes
configure_routes() {
    echo ""
    echo -e "${BLUE}⚙️  Configuring routes...${NC}"

    local server_file="backend/src/server.ts"

    # Backup original if not already backed up
    if [ ! -f "${server_file}.original" ]; then
        cp "$server_file" "${server_file}.original"
    fi

    # Update import statement
    if [ "$ROUTES_FILE" = "routes" ]; then
        # Restore original for default routes
        if [ -f "${server_file}.original" ]; then
            cp "${server_file}.original" "$server_file"
        fi
    else
        # Update to use selected routes
        sed -i.bak "s|from './routes'.*|from './$ROUTES_FILE';|g" "$server_file"
        sed -i.bak "s|from './routes.vision'.*|from './$ROUTES_FILE';|g" "$server_file"
        sed -i.bak "s|from './routes.optimized'.*|from './$ROUTES_FILE';|g" "$server_file"
        rm -f "${server_file}.bak"
    fi

    echo -e "${GREEN}✅ Routes configured to use: $ROUTES_FILE${NC}"
}

# Function to start server
start_server() {
    echo ""
    echo -e "${PURPLE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                   Starting Server                          ║${NC}"
    echo -e "${PURPLE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Version:${NC} $VERSION_NAME"
    echo -e "${CYAN}Backend:${NC} http://localhost:$BACKEND_PORT"
    echo -e "${CYAN}API Docs:${NC} See README.md"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    cd backend
    npm run dev
}

# Main execution
main() {
    # Step 1: Kill processes on ports
    echo -e "${BLUE}🧹 Cleaning up ports...${NC}"
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT

    # Step 2: Check dependencies
    check_dependencies

    # Step 3: Setup database
    setup_database

    # Step 4: Setup API key
    setup_api_key

    # Step 5: Choose version
    choose_version

    # Step 6: Configure routes
    configure_routes

    # Step 7: Start server
    start_server
}

# Run main function
main
