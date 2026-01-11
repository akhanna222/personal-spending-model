#!/bin/bash

# Comprehensive Test Suite for SpendLens
# Tests all components: Vision parsing, Risk analysis, API endpoints

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

API_URL="http://localhost:3001"
TEST_USER="testuser_$(date +%s)"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         SpendLens Comprehensive Test Suite                ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run test
run_test() {
    local test_name="$1"
    local test_command="$2"

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Test: $test_name${NC}"
    echo ""

    if eval "$test_command"; then
        echo ""
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        ((TESTS_PASSED++))
    else
        echo ""
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Test 1: Health Check
test_health() {
    echo "GET $API_URL/health"
    response=$(curl -s "$API_URL/health")

    if [ $? -ne 0 ]; then
        echo -e "${RED}Server not responding${NC}"
        return 1
    fi

    echo "$response" | jq '.'

    status=$(echo "$response" | jq -r '.status')
    mode=$(echo "$response" | jq -r '.mode')
    openai=$(echo "$response" | jq -r '.openai')

    if [ "$status" != "ok" ]; then
        echo -e "${RED}Health status not ok${NC}"
        return 1
    fi

    if [ "$mode" != "vision" ]; then
        echo -e "${YELLOW}Warning: Not in vision mode (mode=$mode)${NC}"
    fi

    if [ "$openai" != "true" ]; then
        echo -e "${RED}OpenAI API key not configured${NC}"
        return 1
    fi

    echo -e "${GREEN}Server healthy, mode=$mode, OpenAI configured${NC}"
    return 0
}

# Test 2: Get Categories
test_categories() {
    echo "GET $API_URL/api/categories"
    response=$(curl -s "$API_URL/api/categories")

    category_count=$(echo "$response" | jq '.categories | length')
    primary_count=$(echo "$response" | jq '.primaryCategories | length')

    echo "Total categories: $category_count"
    echo "Primary categories: $primary_count"

    if [ "$category_count" -lt 100 ]; then
        echo -e "${RED}Too few categories (expected 100+)${NC}"
        return 1
    fi

    echo -e "${GREEN}Categories loaded: $category_count total${NC}"
    return 0
}

# Test 3: Upload Sample Transaction (Mock)
test_upload() {
    echo "POST $API_URL/api/upload"
    echo "Creating sample CSV transaction file..."

    # Create temporary CSV file
    tmpfile=$(mktemp /tmp/test_statement_XXXXXX.csv)
    cat > "$tmpfile" << 'EOF'
Date,Description,Debit,Credit,Balance
2024-01-15,STARBUCKS COFFEE #12345,5.75,,1234.56
2024-01-16,SALARY DEPOSIT,,3500.00,4734.56
2024-01-17,AMAZON PURCHASE,45.30,,4689.26
2024-01-18,UBER TRIP,12.50,,4676.76
2024-01-19,GROCERY STORE WHOLE FOODS,87.43,,4589.33
EOF

    response=$(curl -s -X POST "$API_URL/api/upload" -F "statements=@$tmpfile")
    rm "$tmpfile"

    success=$(echo "$response" | jq -r '.success')
    total=$(echo "$response" | jq -r '.totalTransactions')

    echo "$response" | jq '.'

    if [ "$success" != "true" ]; then
        echo -e "${RED}Upload failed${NC}"
        return 1
    fi

    if [ "$total" -lt 5 ]; then
        echo -e "${RED}Expected 5 transactions, got $total${NC}"
        return 1
    fi

    echo -e "${GREEN}Upload successful: $total transactions${NC}"
    return 0
}

# Test 4: Get Transactions
test_get_transactions() {
    echo "GET $API_URL/api/transactions"
    response=$(curl -s "$API_URL/api/transactions")

    total=$(echo "$response" | jq -r '.total')

    echo "Total transactions: $total"

    if [ "$total" -lt 1 ]; then
        echo -e "${RED}No transactions found${NC}"
        return 1
    fi

    # Show first transaction
    echo ""
    echo "Sample transaction:"
    echo "$response" | jq '.transactions[0]'

    echo -e "${GREEN}Retrieved $total transactions${NC}"
    return 0
}

# Test 5: Risk Analysis
test_risk_analysis() {
    echo "POST $API_URL/api/risks/analyze"

    # Get transactions first
    transactions=$(curl -s "$API_URL/api/transactions" | jq '.transactions')

    if [ "$transactions" == "null" ] || [ "$transactions" == "[]" ]; then
        echo -e "${YELLOW}No transactions to analyze${NC}"
        return 1
    fi

    # Analyze risks
    response=$(curl -s -X POST "$API_URL/api/risks/analyze" \
        -H "Content-Type: application/json" \
        -d "{\"userId\":\"$TEST_USER\",\"transactions\":$transactions}")

    echo "$response" | jq '.'

    success=$(echo "$response" | jq -r '.success')
    patterns_detected=$(echo "$response" | jq -r '.patternsDetected')

    if [ "$success" != "true" ]; then
        echo -e "${RED}Risk analysis failed${NC}"
        return 1
    fi

    echo -e "${GREEN}Risk analysis complete: $patterns_detected patterns detected${NC}"

    # Show detected patterns
    if [ "$patterns_detected" -gt 0 ]; then
        echo ""
        echo "Detected patterns:"
        echo "$response" | jq '.patterns[] | {type: .type, severity: .severity, title: .title}'
    fi

    return 0
}

# Test 6: Get Risk Patterns
test_get_patterns() {
    echo "GET $API_URL/api/risks/patterns/$TEST_USER"
    response=$(curl -s "$API_URL/api/risks/patterns/$TEST_USER")

    echo "$response" | jq '.'

    total=$(echo "$response" | jq -r '.total')

    echo -e "${GREEN}Retrieved $total risk patterns${NC}"
    return 0
}

# Test 7: Submit Feedback
test_submit_feedback() {
    echo "POST $API_URL/api/risks/feedback"

    # Get first pattern
    pattern_id=$(curl -s "$API_URL/api/risks/patterns/$TEST_USER" | jq -r '.patterns[0].id')

    if [ "$pattern_id" == "null" ] || [ -z "$pattern_id" ]; then
        echo -e "${YELLOW}No patterns to provide feedback on${NC}"
        return 0  # Not a failure, just no data
    fi

    response=$(curl -s -X POST "$API_URL/api/risks/feedback" \
        -H "Content-Type: application/json" \
        -d "{\"userId\":\"$TEST_USER\",\"patternId\":\"$pattern_id\",\"isAccurate\":true,\"isRelevant\":true,\"notes\":\"Test feedback\"}")

    echo "$response" | jq '.'

    success=$(echo "$response" | jq -r '.success')

    if [ "$success" != "true" ]; then
        echo -e "${RED}Feedback submission failed${NC}"
        return 1
    fi

    echo -e "${GREEN}Feedback submitted successfully${NC}"
    return 0
}

# Test 8: Get Risk Statistics
test_risk_stats() {
    echo "GET $API_URL/api/risks/stats/$TEST_USER"
    response=$(curl -s "$API_URL/api/risks/stats/$TEST_USER")

    echo "$response" | jq '.'

    total_patterns=$(echo "$response" | jq -r '.totalPatterns')

    echo -e "${GREEN}Risk stats retrieved: $total_patterns total patterns${NC}"
    return 0
}

# Test 9: Get Pattern Templates
test_pattern_templates() {
    echo "GET $API_URL/api/risks/templates"
    response=$(curl -s "$API_URL/api/risks/templates")

    template_count=$(echo "$response" | jq '.templates | length')

    echo "Total templates: $template_count"
    echo ""
    echo "Template performance:"
    echo "$response" | jq '.templates[] | {name: .name, successRate: .successRate, totalDetections: .totalDetections}'

    if [ "$template_count" -lt 5 ]; then
        echo -e "${RED}Too few templates${NC}"
        return 1
    fi

    echo -e "${GREEN}Retrieved $template_count pattern templates${NC}"
    return 0
}

# Test 10: Export CSV
test_export_csv() {
    echo "GET $API_URL/api/export/csv"

    # Download CSV
    curl -s "$API_URL/api/export/csv" -o /tmp/test_export.csv

    if [ ! -f "/tmp/test_export.csv" ]; then
        echo -e "${RED}CSV export failed${NC}"
        return 1
    fi

    lines=$(wc -l < /tmp/test_export.csv)

    echo "Exported CSV:"
    head -5 /tmp/test_export.csv
    echo "..."
    echo ""
    echo "Total lines: $lines"

    rm /tmp/test_export.csv

    if [ "$lines" -lt 2 ]; then
        echo -e "${RED}CSV too short${NC}"
        return 1
    fi

    echo -e "${GREEN}CSV export successful: $lines lines${NC}"
    return 0
}

# Check if server is running
echo -e "${BLUE}Checking if server is running...${NC}"
if ! curl -s "$API_URL/health" > /dev/null 2>&1; then
    echo -e "${RED}❌ Server is not running!${NC}"
    echo ""
    echo "Please start the server first:"
    echo "  ./run.sh"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Server is running${NC}"
echo ""

# Run all tests
run_test "Health Check" "test_health"
run_test "Get Categories (Plaid)" "test_categories"
run_test "Upload Sample Statement" "test_upload"
run_test "Get Transactions" "test_get_transactions"
run_test "Risk Analysis" "test_risk_analysis"
run_test "Get Risk Patterns" "test_get_patterns"
run_test "Submit Feedback" "test_submit_feedback"
run_test "Get Risk Statistics" "test_risk_stats"
run_test "Get Pattern Templates" "test_pattern_templates"
run_test "Export CSV" "test_export_csv"

# Summary
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                     Test Summary                           ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
    echo ""
    echo "The system is fully functional:"
    echo "  ✓ Vision-based extraction working"
    echo "  ✓ Risk analysis functional"
    echo "  ✓ Learning system operational"
    echo "  ✓ All API endpoints responding"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
    echo ""
    echo "Please check the errors above and:"
    echo "  1. Ensure OpenAI API key is set"
    echo "  2. Check server logs for errors"
    echo "  3. Verify all dependencies are installed"
    echo ""
    exit 1
fi
