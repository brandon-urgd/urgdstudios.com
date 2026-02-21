#!/bin/bash
# Smoke test script for urgdstudios.com
# Tests public health endpoints via CloudFront (production URL)

set -euo pipefail

BASE_URL="${BASE_URL:-https://urgdstudios.com}"
FAILED=0

check() {
  local LABEL="$1"
  local URL="$2"
  local EXPECTED="$3"

  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
  if [ "$RESPONSE" = "$EXPECTED" ]; then
    echo "✅ $LABEL (HTTP $RESPONSE)"
  else
    echo "❌ $LABEL — expected HTTP $EXPECTED, got HTTP $RESPONSE"
    FAILED=$((FAILED + 1))
  fi
}

echo "🧪 Running smoke tests against $BASE_URL"
echo ""

check "Intake health check" "$BASE_URL/v1/intake/health" "200"
check "Admin health check (no auth)" "$BASE_URL/v1/admin/health" "200"
check "Admin messages (no auth → 401)" "$BASE_URL/v1/admin/messages" "401"

echo ""
if [ "$FAILED" -eq 0 ]; then
  echo "✅ All smoke tests passed"
  exit 0
else
  echo "❌ $FAILED smoke test(s) failed"
  exit 1
fi
