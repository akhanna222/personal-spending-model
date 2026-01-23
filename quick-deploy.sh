#!/bin/bash
set -e

echo "============================================"
echo "   SpendLens Quick Deployment Script"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

echo -e "${GREEN}✅ Docker is installed${NC}"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✅ Docker Compose is installed${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}📝 Please edit .env file and add your API keys:${NC}"
    echo "   - OPENAI_API_KEY"
    echo "   - DB_PASSWORD"
    echo "   - JWT_SECRET"
    echo ""
    read -p "Press Enter after you've updated the .env file..."
fi

# Validate required environment variables
source .env

if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "sk-proj-your-openai-key-here" ]; then
    echo -e "${RED}❌ OPENAI_API_KEY is not set in .env file${NC}"
    echo "Please get your API key from: https://platform.openai.com/api-keys"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables configured${NC}"
echo ""

# Ask deployment type
echo "Choose deployment method:"
echo "  1) Full deployment (Frontend + Backend + Database)"
echo "  2) Backend only (for use with external frontend)"
echo "  3) Stop all services"
echo "  4) View logs"
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}🚀 Starting full deployment...${NC}"
        docker-compose -f docker-compose.production.yml up -d

        echo ""
        echo "⏳ Waiting for services to start..."
        sleep 10

        # Check if services are running
        if docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
            echo -e "${GREEN}✅ Services started successfully!${NC}"
            echo ""
            echo "📊 Service Status:"
            docker-compose -f docker-compose.production.yml ps
            echo ""
            echo -e "${GREEN}🎉 Deployment complete!${NC}"
            echo ""
            echo "Access your application:"
            echo "  Frontend: http://localhost"
            echo "  Backend API: http://localhost:3001"
            echo "  Health Check: http://localhost:3001/health"
            echo ""
            echo "Management commands:"
            echo "  View logs: docker-compose -f docker-compose.production.yml logs -f"
            echo "  Stop: docker-compose -f docker-compose.production.yml down"
            echo "  Restart: docker-compose -f docker-compose.production.yml restart"
        else
            echo -e "${RED}❌ Some services failed to start${NC}"
            echo "Check logs with: docker-compose -f docker-compose.production.yml logs"
        fi
        ;;

    2)
        echo ""
        echo -e "${GREEN}🚀 Starting backend services only...${NC}"
        docker-compose -f docker-compose.production.yml up -d postgres backend

        echo ""
        echo "⏳ Waiting for services to start..."
        sleep 10

        echo -e "${GREEN}✅ Backend services started!${NC}"
        echo ""
        echo "Access your backend:"
        echo "  API: http://localhost:3001"
        echo "  Health Check: http://localhost:3001/health"
        ;;

    3)
        echo ""
        echo -e "${YELLOW}🛑 Stopping all services...${NC}"
        docker-compose -f docker-compose.production.yml down
        echo -e "${GREEN}✅ All services stopped${NC}"
        ;;

    4)
        echo ""
        echo -e "${GREEN}📋 Showing logs (Ctrl+C to exit)...${NC}"
        docker-compose -f docker-compose.production.yml logs -f
        ;;

    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "============================================"
