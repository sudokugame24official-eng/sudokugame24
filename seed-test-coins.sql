-- Give test users coins for testing
UPDATE "Profile" SET coins = 50000, hints = 10 WHERE "userId" IN (
  SELECT id FROM "User" WHERE email IN ('test@sudoku.com', 'friend@sudoku.com')
);
