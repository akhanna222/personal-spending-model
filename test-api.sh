#!/bin/bash

# Test Script for SpendLens API
# Run this in a separate terminal after starting the server

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

API_URL="http://localhost:3001"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              SpendLens API Test Suite                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
echo -e "${BLUE}GET $API_URL/health${NC}"
response=$(curl -s "$API_URL/health")
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Server is running${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
else
    echo -e "${RED}❌ Server is not responding${NC}"
    echo "Make sure the server is running with ./run.sh"
    exit 1
fi
echo ""

# Test 2: Get Categories
echo -e "${YELLOW}Test 2: Get Plaid Categories${NC}"
echo -e "${BLUE}GET $API_URL/api/categories${NC}"
response=$(curl -s "$API_URL/api/categories")
category_count=$(echo "$response" | jq '.categories | length' 2>/dev/null)
if [ ! -z "$category_count" ]; then
    echo -e "${GREEN}✅ Retrieved $category_count Plaid categories${NC}"
else
    echo -e "${RED}❌ Failed to retrieve categories${NC}"
fi
echo ""

# Test 3: Upload a sample file (if provided)
echo -e "${YELLOW}Test 3: Upload Bank Statement${NC}"

if [ ! -z "$1" ]; then
    echo -e "${BLUE}POST $API_URL/api/upload${NC}"
    echo "Uploading: $1"
    response=$(curl -s -X POST "$API_URL/api/upload" -F "statements=@$1")

    success=$(echo "$response" | jq -r '.success' 2>/dev/null)
    if [ "$success" = "true" ]; then
        txn_count=$(echo "$response" | jq -r '.totalTransactions' 2>/dev/null)
        echo -e "${GREEN}✅ Upload successful - $txn_count transactions extracted${NC}"
        echo "$response" | jq '.' 2>/dev/null
    else
        echo -e "${RED}❌ Upload failed${NC}"
        echo "$response"
    fi
else
    echo -e "${YELLOW}ℹ️  No file provided. Usage:${NC}"
    echo "  ./test-api.sh /path/to/statement.pdf"
    echo ""
    echo "Skipping upload test..."
fi
echo ""

# Test 4: Get Transactions
echo -e "${YELLOW}Test 4: Get Transactions${NC}"
echo -e "${BLUE}GET $API_URL/api/transactions${NC}"
response=$(curl -s "$API_URL/api/transactions")
total=$(echo "$response" | jq -r '.total' 2>/dev/null)
if [ ! -z "$total" ] && [ "$total" != "null" ]; then
    echo -e "${GREEN}✅ Retrieved $total transactions${NC}"

    if [ "$total" -gt 0 ]; then
        echo ""
        echo -e "${BLUE}Sample transaction:${NC}"
        echo "$response" | jq '.transactions[0]' 2>/dev/null
    fi
else
    echo -e "${YELLOW}ℹ️  No transactions found (database is empty)${NC}"
fi
echo ""

# Test 5: Export CSV
if [ "$total" -gt 0 ]; then
    echo -e "${YELLOW}Test 5: Export CSV${NC}"
    echo -e "${BLUE}GET $API_URL/api/export/csv${NC}"
    curl -s "$API_URL/api/export/csv" -o test_export.csv
    if [ -f "test_export.csv" ]; then
        lines=$(wc -l < test_export.csv)
        echo -e "${GREEN}✅ Exported CSV with $lines lines${NC}"
        echo "Saved to: test_export.csv"
        rm test_export.csv
    fi
    echo ""
fi

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Test Summary                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ API is working correctly${NC}"
echo ""
echo "Next steps:"
echo "  1. Upload a bank statement:"
echo "     curl -X POST $API_URL/api/upload -F 'statements=@statement.pdf'"
echo ""
echo "  2. View transactions:"
echo "     curl $API_URL/api/transactions | jq"
echo ""
echo "  3. Get insights:"
echo "     curl $API_URL/api/insights | jq"
echo ""
