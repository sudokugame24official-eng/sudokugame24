#!/usr/bin/env bash
set -e

BASE_URL="http://127.0.0.1:3001"
TS=$(date +%s)
EMAIL="academy_test_${TS}@example.com"
USERNAME="acad_usr_${TS}"
PASSWORD="AcademySecurePassword123!"

echo "=== 1. REGISTER USER ==="
REG_RES=$(curl -s -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"username\":\"${USERNAME}\",\"password\":\"${PASSWORD}\"}")
echo "Register response: ${REG_RES}"

echo "=== 2. RETRIEVE VERIFICATION TOKEN FROM DB ==="
TOKEN=$(docker exec sudoku_postgres psql -U sudoku_prod_admin -d sudokugame24_db -t -A -c \
  "SELECT \"token\" FROM \"AuthToken\" WHERE \"type\" = 'EMAIL_VERIFICATION' AND \"userId\" = (SELECT \"id\" FROM \"User\" WHERE \"email\" = '${EMAIL}');")
echo "Found token: ${TOKEN}"

echo "=== 3. VERIFY EMAIL ==="
VER_RES=$(curl -s -X POST "${BASE_URL}/auth/verify-email" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"${TOKEN}\"}")
echo "Verify response: ${VER_RES}"

echo "=== 4. LOGIN TO GET JWT ==="
LOGIN_RES=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")
echo "Login response: ${LOGIN_RES}"
ACCESS_TOKEN=$(echo "${LOGIN_RES}" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "${ACCESS_TOKEN}" ]; then
  echo "FAIL: Could not obtain accessToken"
  exit 1
fi
echo "Obtained Access Token: ${ACCESS_TOKEN:0:20}..."

echo "=== 5. FETCH COURSES ==="
COURSES_RES=$(curl -s -X GET "${BASE_URL}/academy/courses" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")
COURSE_COUNT=$(echo "${COURSES_RES}" | grep -o '"slug"' | wc -l)
echo "Courses returned: ${COURSE_COUNT}"

echo "=== 6. COMPLETE LESSON ==="
COMPLETE_RES=$(curl -s -X POST "${BASE_URL}/academy/lessons/lsn_fund_001/complete" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json")
echo "Complete Lesson Response: ${COMPLETE_RES}"

echo "=== 7. SUBMIT QUIZ ==="
# Questions: correctIndex are 1 and 2
QUIZ_RES=$(curl -s -X POST "${BASE_URL}/academy/quizzes/qiz_fund_001/submit" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"answers":[1, 2]}')
echo "Submit Quiz Response: ${QUIZ_RES}"

echo "=== 8. CHECK USER PROGRESS ENDPOINT ==="
PROG_RES=$(curl -s -X GET "${BASE_URL}/academy/progress" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")
echo "Progress Response: ${PROG_RES}"

echo "=== 9. VERIFY DIRECTLY IN POSTGRES ==="
DB_CHECK=$(docker exec sudoku_postgres psql -U sudoku_prod_admin -d sudokugame24_db -c \
  "SELECT u.email, ulp.\"lessonId\", ulp.completed, qr.score, qr.passed 
   FROM \"User\" u 
   LEFT JOIN \"UserLessonProgress\" ulp ON ulp.\"userId\" = u.id 
   LEFT JOIN \"QuizResult\" qr ON qr.\"userId\" = u.id 
   WHERE u.email = '${EMAIL}';")
echo "${DB_CHECK}"

echo "=== 10. CLEANUP TEST USER ==="
docker exec sudoku_postgres psql -U sudoku_prod_admin -d sudokugame24_db -c \
  "DELETE FROM \"User\" WHERE \"email\" = '${EMAIL}';"

echo "=== ACADEMY E2E TEST COMPLETED SUCCESSFULLY ==="
