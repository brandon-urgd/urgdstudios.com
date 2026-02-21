#!/bin/bash
# Manual API test script for Command Center admin endpoints (Slice 0)
#
# Usage:
#   # Unauthenticated tests only (no TOKEN required):
#   bash scripts/test-admin-api.sh
#
#   # Full test suite with authenticated endpoints:
#   TOKEN="eyJ..." bash scripts/test-admin-api.sh
#
#   # Point at a non-production base URL:
#   BASE_URL="https://abc123.execute-api.us-west-2.amazonaws.com/prod" TOKEN="eyJ..." bash scripts/test-admin-api.sh
#
# TOKEN must be a valid Cognito access token obtained via:
#   aws cognito-idp initiate-auth --auth-flow USER_SRP_AUTH --client-id <client-id> ...
#   (or sign in at /command/login after Slice 01 frontend is deployed)

set -euo pipefail

BASE_URL="${BASE_URL:-https://urgdstudios.com}"
TOKEN="${TOKEN:-}"

PASS=0
FAIL=0
SKIP=0

# ── Helpers ───────────────────────────────────────────────────────────────────
check() {
  local LABEL="$1"
  local EXPECTED_CODE="$2"
  local ACTUAL_CODE="$3"
  local BODY="$4"

  if [ "$ACTUAL_CODE" = "$EXPECTED_CODE" ]; then
    echo "✅ $LABEL (HTTP $ACTUAL_CODE)"
    PASS=$((PASS + 1))
  else
    echo "❌ $LABEL — expected HTTP $EXPECTED_CODE, got HTTP $ACTUAL_CODE"
    echo "   Body: $BODY"
    FAIL=$((FAIL + 1))
  fi
}

require_token() {
  if [ -z "$TOKEN" ]; then
    echo "⏭  SKIP: $1 — requires TOKEN env var (set TOKEN=<cognito-access-token>)"
    SKIP=$((SKIP + 1))
    return 1
  fi
  return 0
}

authed_get() {
  curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "$BASE_URL$1"
}

authed_post() {
  curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$2" \
    "$BASE_URL$1"
}

authed_patch() {
  curl -s -w "\n%{http_code}" \
    -X PATCH \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$2" \
    "$BASE_URL$1"
}

authed_delete() {
  curl -s -w "\n%{http_code}" \
    -X DELETE \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL$1"
}

parse_response() {
  # Last line is HTTP code, rest is body
  echo "$1" | head -n -1
}

parse_code() {
  echo "$1" | tail -n 1
}

echo ""
echo "========================================="
echo "  Command Center Admin API — Manual Tests"
echo "  Base URL: $BASE_URL"
echo "========================================="
echo ""

# ── 1. Health check (unauthenticated) ─────────────────────────────────────────
echo "--- Unauthenticated tests ---"

RAW=$(curl -s -w "\n%{http_code}" "$BASE_URL/v1/admin/health")
CODE=$(parse_code "$RAW")
BODY=$(parse_response "$RAW")
check "GET /v1/admin/health → 200" "200" "$CODE" "$BODY"

# ── 2. Unauthenticated access to protected endpoint ───────────────────────────
RAW=$(curl -s -w "\n%{http_code}" "$BASE_URL/v1/admin/messages")
CODE=$(parse_code "$RAW")
BODY=$(parse_response "$RAW")
check "GET /v1/admin/messages (no auth) → 401" "401" "$CODE" "$BODY"

# ── Authenticated tests (require TOKEN) ───────────────────────────────────────
echo ""
echo "--- Authenticated tests ---"

if require_token "List messages"; then
  RAW=$(authed_get "/v1/admin/messages")
  CODE=$(parse_code "$RAW")
  BODY=$(parse_response "$RAW")
  check "GET /v1/admin/messages → 200" "200" "$CODE" "$BODY"

  # ── 3. Submit via intake, then verify it appears in list ───────────────────
  echo ""
  echo "--- Submit via intake then verify in dashboard ---"

  INTAKE_RAW=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test User",
      "email": "test@example.com",
      "type": "general-inquiry",
      "message": "This is a test submission from test-admin-api.sh",
      "honeypot": "",
      "proofOfWork": {"challenge": "skip", "nonce": "0", "solution": "skip"}
    }' \
    "$BASE_URL/v1/intake")
  INTAKE_CODE=$(parse_code "$INTAKE_RAW")
  INTAKE_BODY=$(parse_response "$INTAKE_RAW")

  # Note: PoW verification will likely reject this. The test below checks intake
  # connectivity (200 or 400 are both acceptable — 500 is a failure).
  if [ "$INTAKE_CODE" = "200" ] || [ "$INTAKE_CODE" = "400" ] || [ "$INTAKE_CODE" = "429" ]; then
    echo "✅ POST /v1/intake → HTTP $INTAKE_CODE (connectivity confirmed)"
    PASS=$((PASS + 1))
  else
    echo "❌ POST /v1/intake → unexpected HTTP $INTAKE_CODE"
    echo "   Body: $INTAKE_BODY"
    FAIL=$((FAIL + 1))
  fi

  # Extract submissionId if submission succeeded
  SUBMISSION_ID=""
  if [ "$INTAKE_CODE" = "200" ]; then
    SUBMISSION_ID=$(echo "$INTAKE_BODY" | grep -o '"submissionId":"[^"]*"' | cut -d'"' -f4 || true)
    if [ -n "$SUBMISSION_ID" ]; then
      echo "   submissionId: $SUBMISSION_ID"

      # Re-fetch list and verify new message appears
      LIST_RAW=$(authed_get "/v1/admin/messages")
      LIST_BODY=$(parse_response "$LIST_RAW")
      if echo "$LIST_BODY" | grep -q "$SUBMISSION_ID"; then
        echo "✅ New submission appears in message list"
        PASS=$((PASS + 1))
      else
        echo "❌ New submission NOT found in message list (may be DynamoDB propagation delay)"
        FAIL=$((FAIL + 1))
      fi
    fi
  fi

  # ── 4. Get single message ──────────────────────────────────────────────────
  echo ""
  echo "--- Single message operations ---"

  if [ -n "$SUBMISSION_ID" ]; then
    RAW=$(authed_get "/v1/admin/messages/$SUBMISSION_ID")
    CODE=$(parse_code "$RAW")
    BODY=$(parse_response "$RAW")
    check "GET /v1/admin/messages/{id} → 200" "200" "$CODE" "$BODY"

    # ── 5. Update status ────────────────────────────────────────────────────
    RAW=$(authed_patch "/v1/admin/messages/$SUBMISSION_ID" '{"status":"in-progress"}')
    CODE=$(parse_code "$RAW")
    BODY=$(parse_response "$RAW")
    check "PATCH /v1/admin/messages/{id} status=in-progress → 200" "200" "$CODE" "$BODY"

    # ── 6. Invalid status ───────────────────────────────────────────────────
    RAW=$(authed_patch "/v1/admin/messages/$SUBMISSION_ID" '{"status":"invalid-status"}')
    CODE=$(parse_code "$RAW")
    BODY=$(parse_response "$RAW")
    check "PATCH /v1/admin/messages/{id} status=invalid → 400" "400" "$CODE" "$BODY"

    # ── 7. Reply ────────────────────────────────────────────────────────────
    RAW=$(authed_post "/v1/admin/messages/$SUBMISSION_ID/reply" '{"body":"This is a test reply from the test-admin-api.sh script."}')
    CODE=$(parse_code "$RAW")
    BODY=$(parse_response "$RAW")
    check "POST /v1/admin/messages/{id}/reply → 200" "200" "$CODE" "$BODY"

    # ── 8. Delete ───────────────────────────────────────────────────────────
    RAW=$(authed_delete "/v1/admin/messages/$SUBMISSION_ID")
    CODE=$(parse_code "$RAW")
    BODY=$(parse_response "$RAW")
    check "DELETE /v1/admin/messages/{id} → 204" "204" "$CODE" "$BODY"

    # Verify 404 after delete
    RAW=$(authed_get "/v1/admin/messages/$SUBMISSION_ID")
    CODE=$(parse_code "$RAW")
    BODY=$(parse_response "$RAW")
    check "GET /v1/admin/messages/{id} after delete → 404" "404" "$CODE" "$BODY"

  else
    echo "⏭  SKIP: Single-message tests — no valid submissionId available"
    echo "   (Either intake PoW rejected the test submission, or provide an existing ID)"
    SKIP=$((SKIP + 4))

    # Still test with a well-formed but non-existent UUID
    FAKE_ID="00000000-0000-4000-8000-000000000001"
    RAW=$(authed_get "/v1/admin/messages/$FAKE_ID")
    CODE=$(parse_code "$RAW")
    BODY=$(parse_response "$RAW")
    check "GET /v1/admin/messages/{fake-id} → 404" "404" "$CODE" "$BODY"
  fi
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "========================================="
echo "  Results: $PASS passed, $FAIL failed, $SKIP skipped"
echo "========================================="
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
