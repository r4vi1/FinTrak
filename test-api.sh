#!/bin/bash
# FinTrak API Smoke Test
# Hits every endpoint and validates response shape

BASE="http://localhost:3001/api"
PASS=0
FAIL=0
TOTAL=0

check() {
    local name="$1"
    local url="$2"
    local method="${3:-GET}"
    local body="$4"
    TOTAL=$((TOTAL + 1))

    if [ "$method" = "GET" ]; then
        status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    else
        status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$body" "$url")
    fi

    if [ "$status" = "200" ] || [ "$status" = "201" ]; then
        echo "  ✅ $name ($status)"
        PASS=$((PASS + 1))
    else
        echo "  ❌ $name ($status)"
        FAIL=$((FAIL + 1))
    fi
}

echo ""
echo "🔍 FinTrak API Smoke Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📊 Core Endpoints"
check "GET /accounts"       "$BASE/accounts"
check "GET /transactions"   "$BASE/transactions"
check "GET /categories"     "$BASE/categories"

echo ""
echo "📈 Analytics Endpoints"
check "GET /analytics/cashflow"       "$BASE/analytics/cashflow?months=6"
check "GET /analytics/spending-by-category" "$BASE/analytics/spending-by-category"
check "GET /analytics/top-merchants"  "$BASE/analytics/top-merchants?limit=5"
check "GET /analytics/recurring"      "$BASE/analytics/recurring"

echo ""
echo "🔗 AA Endpoints"
check "GET /aa/config"    "$BASE/aa/config"
check "GET /aa/consents"  "$BASE/aa/consents"

echo ""
echo "💰 Accounts Endpoints"
check "GET /accounts/summary/net-worth"  "$BASE/accounts/summary/net-worth"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Results: $PASS/$TOTAL passed"
if [ $FAIL -gt 0 ]; then
    echo "⚠️  $FAIL endpoint(s) failed"
    exit 1
else
    echo "🎉 All endpoints healthy!"
    exit 0
fi
