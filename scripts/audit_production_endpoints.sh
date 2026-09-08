#!/usr/bin/env bash

URLS=(
  "https://sudokugame24.com/"
  "https://sudokugame24.com/en"
  "https://sudokugame24.com/fr"
  "https://sudokugame24.com/en/auth"
  "https://sudokugame24.com/en/learn/courses"
  "https://sudokugame24.com/en/learn/courses/sudoku-fundamentals"
  "https://sudokugame24.com/en/learn/courses/sudoku-fundamentals/lessons/grid-anatomy-basics"
  "https://sudokugame24.com/en/sudoku"
  "https://sudokugame24.com/en/sudoku/easy"
  "https://sudokugame24.com/en/sudoku/medium"
  "https://sudokugame24.com/en/sudoku/hard"
  "https://sudokugame24.com/en/sudoku/expert"
  "https://sudokugame24.com/en/duel"
  "https://sudokugame24.com/en/leaderboard"
  "https://sudokugame24.com/en/daily"
  "https://sudokugame24.com/en/forum"
  "https://sudokugame24.com/sitemap.xml"
  "https://sudokugame24.com/robots.txt"
  "https://sudokugame24.com/api/health"
)

echo "=== SUDOKUGAME24.COM LIVE AUDIT ==="
for u in "${URLS[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$u")
  echo "HTTP $STATUS | $u"
done
echo "=== AUDIT COMPLETE ==="
