#!/bin/bash

# SpendLens Setup Script for macOS/Linux
# Run this script from the project root: ./setup.sh

set -e

echo "========================================"
echo "  SpendLens - macOS/Linux Setup Script"
echo "========================================"
echo ""

# Check if Node.js is installed
echo "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js $NODE_VERSION detected"
else
    echo "✗ Node.js is not installed!"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo ""

# Install root dependencies
echo "Installing root dependencies..."
npm install
echo "✓ Root dependencies installed"
echo ""

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend && npm install && cd ..
echo "✓ Backend dependencies installed"
echo ""

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend && npm install && cd ..
echo "✓ Frontend dependencies installed"
echo ""

# Check for .env file
echo "Checking environment configuration..."
if [ -f "backend/.env" ]; then
    echo "✓ backend/.env file exists"
else
    echo "⚠ backend/.env file not found"
    echo ""
    read -p "Would you like to create it now? (y/n) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "Please enter your Anthropic API key"
        echo "(Get one at: https://console.anthropic.com/)"
        read -p "API Key: " API_KEY

        if [ ! -z "$API_KEY" ]; then
            cat > backend/.env << EOF
ANTHROPIC_API_KEY=$API_KEY
PORT=3001
NODE_ENV=development
EOF
            echo "✓ backend/.env file created"
        else
            echo "⚠ Skipped .env creation (no API key provided)"
        fi
    else
        echo "⚠ Remember to create backend/.env before running the app"
    fi
fi

echo ""
echo "========================================"
echo "  Setup Complete! 🎉"
echo "========================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Make sure backend/.env has your ANTHROPIC_API_KEY"
echo "2. Run the application:"
echo "   npm run dev"
echo ""
echo "3. Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "4. Try the sample data:"
echo "   Upload sample-statement.csv from the project root"
echo ""
echo "Need help? Check README.md or visit:"
echo "https://github.com/akhanna222/personal-spending-model"
echo ""
