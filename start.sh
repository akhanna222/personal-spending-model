#!/bin/bash

# SpendLens Quick Start Script

echo "🚀 Starting SpendLens Bank Statement Extraction..."
echo ""

# Check if OpenAI API key is set
if [ -z "$OPENAI_API_KEY" ]; then
  echo "⚠️  OPENAI_API_KEY not set!"
  echo "Please set it: export OPENAI_API_KEY=your_key_here"
  echo ""
  read -p "Enter your OpenAI API key now: " api_key
  export OPENAI_API_KEY=$api_key
fi

echo "✅ OpenAI API key configured"
echo ""

# Install dependencies if needed
if [ ! -d "backend/node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  cd backend && npm install
  cd ..
fi

# Choose which version to run
echo "Which version would you like to run?"
echo ""
echo "1) 🔮 VISION (Recommended) - Zero regex, GPT-4o Vision, 90x faster"
echo "2) ⚡ OPTIMIZED - Batch processing, 10x faster than original"
echo "3) 📝 ORIGINAL - Standard approach"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
  1)
    echo ""
    echo "🔮 Starting VISION version..."
    echo "- Zero regex patterns"
    echo "- GPT-4o Vision reads images directly"
    echo "- Single AI call per file"
    echo ""
    cd backend
    # Update routes to use vision
    if ! grep -q "routes.vision" src/server.ts; then
      echo "Configuring vision routes..."
      cp src/server.ts src/server.ts.backup
      sed -i "s|from './routes'|from './routes.vision'|g" src/server.ts
    fi
    npm run dev
    ;;
  2)
    echo ""
    echo "⚡ Starting OPTIMIZED version..."
    echo "- Batch processing (10 txns per call)"
    echo "- Function calling for structured output"
    echo ""
    cd backend
    if ! grep -q "routes.optimized" src/server.ts; then
      echo "Configuring optimized routes..."
      cp src/server.ts src/server.ts.backup
      sed -i "s|from './routes'|from './routes.optimized'|g" src/server.ts
    fi
    npm run dev
    ;;
  3)
    echo ""
    echo "📝 Starting ORIGINAL version..."
    cd backend
    npm run dev
    ;;
  *)
    echo "Invalid choice. Starting VISION version (recommended)..."
    cd backend
    if ! grep -q "routes.vision" src/server.ts; then
      cp src/server.ts src/server.ts.backup
      sed -i "s|from './routes'|from './routes.vision'|g" src/server.ts
    fi
    npm run dev
    ;;
esac
