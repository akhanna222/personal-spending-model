#!/bin/bash

# ============================================================================
# SpendLens - Simple EC2 Deployment Commands
# ============================================================================
# Copy and paste these commands one by one into your EC2 terminal
# OR run this entire script: chmod +x RUN-ON-EC2.sh && sudo ./RUN-ON-EC2.sh
# ============================================================================

set -e  # Exit on error

echo "============================================"
echo "SpendLens EC2 Deployment"
echo "============================================"
echo ""

# ============================================================================
# OPTION 1: Set OpenAI API Key First (Recommended)
# ============================================================================
echo "Step 1: Set your OpenAI API Key"
echo "Run this command (replace with your actual key):"
echo ""
echo "  export OPENAI_API_KEY=\"sk-proj-xxxxxxxxxxxxxxxxxxxxx\""
echo ""
read -p "Have you set OPENAI_API_KEY? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo ""
    echo "Please run: export OPENAI_API_KEY=\"your-key-here\""
    echo "Then run this script again."
    exit 1
fi

# Check if key is actually set
if [ -z "$OPENAI_API_KEY" ]; then
    echo ""
    echo "ERROR: OPENAI_API_KEY is not set!"
    echo "Please run: export OPENAI_API_KEY=\"your-key-here\""
    exit 1
fi

echo ""
echo "✓ OpenAI API Key is set"
echo ""

# ============================================================================
# OPTION 2: Download and Run Deployment Script
# ============================================================================
echo "Step 2: Downloading deployment script..."
echo ""

curl -fsSL https://raw.githubusercontent.com/akhanna222/personal-spending-model/claude/bank-statement-extraction-pEtji/deploy-ec2.sh -o /tmp/spendlens-deploy.sh

echo "✓ Script downloaded"
echo ""

# ============================================================================
# OPTION 3: Run Deployment
# ============================================================================
echo "Step 3: Running deployment..."
echo ""
echo "This will take 5-10 minutes..."
echo ""

chmod +x /tmp/spendlens-deploy.sh
bash /tmp/spendlens-deploy.sh

echo ""
echo "============================================"
echo "Deployment Complete!"
echo "============================================"
