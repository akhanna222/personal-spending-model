#!/bin/bash

# SpendLens Database Setup Script
# This script sets up the PostgreSQL database for SpendLens

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         🗄️  SpendLens Database Setup                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if .env exists in backend
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend/.env from .env.example..."
    cp backend/.env.example backend/.env

    # Generate a random JWT secret
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

    # Update JWT_SECRET in .env
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/your-super-secret-jwt-key-change-in-production-min-32-chars/$JWT_SECRET/" backend/.env
    else
        sed -i "s/your-super-secret-jwt-key-change-in-production-min-32-chars/$JWT_SECRET/" backend/.env
    fi

    echo "✅ Created backend/.env with random JWT secret"
    echo ""
    echo "⚠️  IMPORTANT: Please update OPENAI_API_KEY in backend/.env"
    echo ""
fi

# Start PostgreSQL with Docker Compose
echo "🚀 Starting PostgreSQL database..."
echo ""

docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if database is healthy
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U spendlens_user -d spendlens &> /dev/null; then
        echo "✅ PostgreSQL is ready!"
        break
    fi

    if [ $i -eq 30 ]; then
        echo "❌ PostgreSQL failed to start after 30 seconds"
        echo "   Check logs with: docker-compose logs postgres"
        exit 1
    fi

    echo -n "."
    sleep 1
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 Database setup complete!"
echo ""
echo "Database Details:"
echo "  • Host: localhost"
echo "  • Port: 5432"
echo "  • Database: spendlens"
echo "  • User: spendlens_user"
echo ""
echo "Useful Commands:"
echo "  • Stop database:    docker-compose down"
echo "  • View logs:        docker-compose logs postgres"
echo "  • Access database:  docker-compose exec postgres psql -U spendlens_user -d spendlens"
echo "  • Reset database:   docker-compose down -v && ./setup-database.sh"
echo ""
echo "Next Steps:"
echo "  1. Update OPENAI_API_KEY in backend/.env"
echo "  2. Run: ./run.sh"
echo ""
