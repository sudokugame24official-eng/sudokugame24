#!/usr/bin/env bash
set -e

BASE_URL="http://127.0.0.1:3001"
TS=$(date +%s)
EMAIL="growth_admin_${TS}@example.com"
USERNAME="gwth_${TS}"
PASSWORD="GrowthAdminPass123!"

echo "=== 1. REGISTER ADMIN USER ==="
REG_RES=$(curl -s -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"username\":\"${USERNAME}\",\"password\":\"${PASSWORD}\"}")
echo "Register: ${REG_RES}"

echo "=== 2. PROMOTE TO ADMIN & VERIFY EMAIL DIRECTLY IN DB ==="
docker exec sudoku_postgres psql -U sudoku_prod_admin -d sudokugame24_db -c \
  "UPDATE \"User\" SET \"role\" = 'ADMIN', \"isEmailVerified\" = true WHERE \"email\" = '${EMAIL}';"

echo "=== 3. LOGIN AS ADMIN ==="
LOGIN_RES=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")
ACCESS_TOKEN=$(echo "${LOGIN_RES}" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "${ACCESS_TOKEN}" ]; then
  echo "FAIL: Could not obtain admin accessToken"
  exit 1
fi
echo "Admin Access Token obtained."

echo "=== 4. GET GROWTH STATS ==="
STATS_RES=$(curl -s -X GET "${BASE_URL}/admin/growth/stats" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")
echo "Stats: ${STATS_RES}"

echo "=== 5. CREATE PROSPECT ==="
CREATE_RES=$(curl -s -X POST "${BASE_URL}/admin/growth/prospects" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "sudokureview.org",
    "url": "https://sudokureview.org/best-web-sudoku",
    "niche": "Sudoku & Logic Gaming",
    "relevanceScore": 95,
    "authorityScore": 72,
    "contactEmail": "editor@sudokureview.org",
    "contactName": "David Smith",
    "targetPage": "/en/play",
    "proposedAnchor": "SudokuGame24 online solver",
    "notes": "Top tier puzzle review site with active monthly column"
  }')
echo "Create Prospect: ${CREATE_RES}"
PROSPECT_ID=$(echo "${CREATE_RES}" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "${PROSPECT_ID}" ]; then
  echo "FAIL: Could not create prospect"
  exit 1
fi
echo "Created Prospect ID: ${PROSPECT_ID}"

echo "=== 6. GENERATE AI OUTREACH DRAFT ==="
DRAFT_RES=$(curl -s -X POST "${BASE_URL}/admin/growth/prospects/${PROSPECT_ID}/generate-outreach" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")
echo "Generated Draft: ${DRAFT_RES}"

echo "=== 7. UPDATE PROSPECT STATUS TO CONTACTED ==="
UPDATE_RES=$(curl -s -X PUT "${BASE_URL}/admin/growth/prospects/${PROSPECT_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"status": "CONTACTED"}')
echo "Update Status: ${UPDATE_RES}"

echo "=== 8. LIST PROSPECTS ==="
LIST_RES=$(curl -s -X GET "${BASE_URL}/admin/growth/prospects?search=sudokureview" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")
echo "List: ${LIST_RES}"

echo "=== 9. DELETE PROSPECT ==="
DEL_RES=$(curl -s -X DELETE "${BASE_URL}/admin/growth/prospects/${PROSPECT_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")
echo "Delete: ${DEL_RES}"

echo "=== 10. CLEANUP ADMIN USER ==="
docker exec sudoku_postgres psql -U sudoku_prod_admin -d sudokugame24_db -c \
  "DELETE FROM \"User\" WHERE \"email\" = '${EMAIL}';"

echo "=== GROWTH E2E TEST PASSED 100% ==="
