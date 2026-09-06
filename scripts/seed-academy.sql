-- ====================================================================
-- SUDOKUGAME24 ACADEMY SEED SCRIPT
-- Idempotent, Additive, Zero Data Loss
-- ====================================================================

-- 1. COURSE 1: Sudoku Fundamentals (BEGINNER)
INSERT INTO "Course" ("id", "slug", "title", "description", "level", "order", "isPublished", "createdAt", "updatedAt")
VALUES (
  'crs_fund_001',
  'sudoku-fundamentals',
  'Sudoku Fundamentals: From Novice to Solver',
  'Learn the foundational rules, scanning techniques, and essential logic needed to solve any easy-to-medium Sudoku puzzle with confidence.',
  'BEGINNER',
  1,
  true,
  NOW(),
  NOW()
) ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "level" = EXCLUDED."level",
  "order" = EXCLUDED."order",
  "isPublished" = true,
  "updatedAt" = NOW();

-- Module 1.1
INSERT INTO "Module" ("id", "courseId", "title", "description", "order", "createdAt", "updatedAt")
VALUES (
  'mod_fund_001',
  (SELECT "id" FROM "Course" WHERE "slug" = 'sudoku-fundamentals'),
  'Grid Anatomy & Core Rules',
  'Understand the geometry of the 9x9 board, rows, columns, and 3x3 nonets.',
  1,
  NOW(),
  NOW()
) ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "order" = EXCLUDED."order",
  "updatedAt" = NOW();

-- Lesson 1.1.1
INSERT INTO "Lesson" ("id", "moduleId", "slug", "title", "content", "order", "interactive", "isPublished", "createdAt", "updatedAt")
VALUES (
  'lsn_fund_001',
  'mod_fund_001',
  'grid-anatomy-basics',
  'Understanding the 9x9 Grid, Rows, Columns & Blocks',
  '<h2>The Architecture of Sudoku</h2><p>A standard Sudoku puzzle consists of an <strong>81-cell grid</strong> arranged in a 9&times;9 matrix. To analyze and solve puzzles methodically, we divide this space into three fundamental structures called <em>houses</em>:</p><ul><li><strong>Rows:</strong> 9 horizontal lines of 9 cells each, numbered 1 to 9 from top to bottom.</li><li><strong>Columns:</strong> 9 vertical lines of 9 cells each, numbered 1 to 9 from left to right.</li><li><strong>Blocks (Boxes/Nonets):</strong> 9 distinct 3&times;3 regions, outlined with thicker borders.</li></ul><p>Each individual cell belongs to exactly <strong>three houses simultaneously</strong>: one row, one column, and one block. This intersection is the heart of all Sudoku logic.</p>',
  1,
  '{"type":"board_preview","highlight":"row1,col1,box1"}',
  true,
  NOW(),
  NOW()
) ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "content" = EXCLUDED."content",
  "order" = EXCLUDED."order",
  "interactive" = EXCLUDED."interactive",
  "isPublished" = true,
  "updatedAt" = NOW();

-- Quiz 1.1.1
INSERT INTO "Quiz" ("id", "lessonId", "title", "order", "questions", "passingScore", "createdAt", "updatedAt")
VALUES (
  'qiz_fund_001',
  'lsn_fund_001',
  'Grid Anatomy Knowledge Check',
  1,
  '[
    {
      "question": "How many total cells make up a standard Sudoku board?",
      "options": ["64", "81", "90", "100"],
      "correctIndex": 1,
      "explanation": "A standard 9x9 grid has 9 rows x 9 columns = 81 cells."
    },
    {
      "question": "Every cell in Sudoku belongs simultaneously to how many houses?",
      "options": ["1 house", "2 houses", "3 houses (1 row, 1 column, 1 block)", "4 houses"],
      "correctIndex": 2,
      "explanation": "Every cell is at the unique intersection of its row, column, and 3x3 block."
    }
  ]'::json,
  80,
  NOW(),
  NOW()
) ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "questions" = EXCLUDED."questions",
  "passingScore" = EXCLUDED."passingScore",
  "updatedAt" = NOW();

-- Lesson 1.1.2
INSERT INTO "Lesson" ("id", "moduleId", "slug", "title", "content", "order", "interactive", "isPublished", "createdAt", "updatedAt")
VALUES (
  'lsn_fund_002',
  'mod_fund_001',
  'the-golden-rule',
  'The Golden Rule: Digits 1 to 9 Exactly Once',
  '<h2>The Single Invariant of Sudoku</h2><p>Sudoku is a game of pure logic, not mathematics. No arithmetic is required. The universal rule is simple:</p><blockquote><strong>Every row, every column, and every 3&times;3 block must contain the digits 1 through 9 exactly once, without repetition.</strong></blockquote><p>Because there are exactly 9 cells in each house and 9 available digits, two consequences immediately follow:</p><ol><li><strong>No Duplicate:</strong> A digit can never appear twice in the same row, column, or block.</li><li><strong>No Omission:</strong> Every digit from 1 to 9 must be present somewhere in each house.</li></ol>',
  2,
  '{"type":"board_preview","highlight":"box5"}',
  true,
  NOW(),
  NOW()
) ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "content" = EXCLUDED."content",
  "order" = EXCLUDED."order",
  "isPublished" = true,
  "updatedAt" = NOW();

-- Module 1.2
INSERT INTO "Module" ("id", "courseId", "title", "description", "order", "createdAt", "updatedAt")
VALUES (
  'mod_fund_002',
  (SELECT "id" FROM "Course" WHERE "slug" = 'sudoku-fundamentals'),
  'First Solving Deductions',
  'Learn cross-hatching, scanning, and finding naked/hidden singles.',
  2,
  NOW(),
  NOW()
) ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "order" = EXCLUDED."order",
  "updatedAt" = NOW();

-- Lesson 1.2.1
INSERT INTO "Lesson" ("id", "moduleId", "slug", "title", "content", "order", "interactive", "isPublished", "createdAt", "updatedAt")
VALUES (
  'lsn_fund_003',
  'mod_fund_002',
  'cross-hatching-scanning',
  'Cross-Hatching & Scanning: Finding Obvious Placements',
  '<h2>Scanning Across Rows and Columns</h2><p>Cross-hatching is the first technique every Sudoku player masters. It works by projecting rows and columns that already contain a digit across a target 3&times;3 block.</p><h3>How Cross-Hatching Works</h3><p>Choose a frequent digit (for example, <strong>7</strong>). Look at a 3&times;3 block that does not yet contain a 7. Trace the rows and columns passing through that block that already have a 7 elsewhere. None of the cells in those rows/columns within the target block can hold a 7. If only one empty cell remains in the block, that cell <em>must</em> be 7!</p>',
  1,
  '{"type":"scanning_demo","digit":7}',
  true,
  NOW(),
  NOW()
) ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "content" = EXCLUDED."content",
  "order" = EXCLUDED."order",
  "isPublished" = true,
  "updatedAt" = NOW();

-- Lesson 1.2.2
INSERT INTO "Lesson" ("id", "moduleId", "slug", "title", "content", "order", "interactive", "isPublished", "createdAt", "updatedAt")
VALUES (
  'lsn_fund_004',
  'mod_fund_002',
  'naked-singles',
  'Naked Singles: When Eight Digits Are Already Seen',
  '<h2>The Power of Elimination</h2><p>A <strong>Naked Single</strong> occurs when a specific empty cell "sees" 8 distinct digits across its row, column, and block combined.</p><p>Because the cell cannot contain any digit that is already present in its row, column, or block, only one single candidate remains possible. That digit is "nakedly" forced into the cell.</p><p><em>Tip:</em> Inspect cells surrounded by many filled neighbors, especially intersections where a near-complete row crosses a near-complete block.</p>',
  2,
  '{"type":"naked_single_demo"}',
  true,
  NOW(),
  NOW()
) ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "content" = EXCLUDED."content",
  "order" = EXCLUDED."order",
  "isPublished" = true,
  "updatedAt" = NOW();

-- 2. COURSE 2: Intermediate Tactics (INTERMEDIATE)
INSERT INTO "Course" ("id", "slug", "title", "description", "level", "order", "isPublished", "createdAt", "updatedAt")
VALUES (
  'crs_inter_001',
  'intermediate-tactics',
  'Intermediate Sudoku: Candidate Elimination & Subsets',
  'Master candidate notation (pencil marks), naked pairs, hidden pairs, and intersection pointing lines to solve medium and hard puzzles.',
  'INTERMEDIATE',
  2,
  true,
  NOW(),
  NOW()
) ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "level" = EXCLUDED."level",
  "order" = EXCLUDED."order",
  "isPublished" = true,
  "updatedAt" = NOW();

-- Module 2.1
INSERT INTO "Module" ("id", "courseId", "title", "description", "order", "createdAt", "updatedAt")
VALUES (
  'mod_inter_001',
  (SELECT "id" FROM "Course" WHERE "slug" = 'intermediate-tactics'),
  'Pencil Marks & Subsets',
  'Transition from mental scanning to precise candidate tracking and subset eliminations.',
  1,
  NOW(),
  NOW()
) ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "order" = EXCLUDED."order",
  "updatedAt" = NOW();

-- Lesson 2.1.1
INSERT INTO "Lesson" ("id", "moduleId", "slug", "title", "content", "order", "interactive", "isPublished", "createdAt", "updatedAt")
VALUES (
  'lsn_inter_001',
  'mod_inter_001',
  'naked-pairs-triples',
  'Naked Pairs & Triples: Locking the House',
  '<h2>What is a Naked Pair?</h2><p>A <strong>Naked Pair</strong> occurs when exactly two cells in the same house (row, column, or block) contain identical sets of exactly two candidate digits &mdash; for example, <code>{3, 7}</code> and <code>{3, 7}</code>.</p><p>Because one cell must be 3 and the other must be 7, <strong>no other cell in that house can contain a 3 or a 7</strong>. You can safely eliminate 3 and 7 from all other candidate lists in that house!</p>',
  1,
  '{"type":"subset_demo","subset":"pair"}',
  true,
  NOW(),
  NOW()
) ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "content" = EXCLUDED."content",
  "order" = EXCLUDED."order",
  "isPublished" = true,
  "updatedAt" = NOW();

-- Lesson 2.1.2
INSERT INTO "Lesson" ("id", "moduleId", "slug", "title", "content", "order", "interactive", "isPublished", "createdAt", "updatedAt")
VALUES (
  'lsn_inter_002',
  'mod_inter_001',
  'pointing-pairs-intersections',
  'Pointing Pairs & Box-Line Reductions',
  '<h2>Intersection Logic</h2><p>When all candidates for a specific digit inside a 3&times;3 block are confined to a single row or column, that digit <strong>points</strong> along that line. It cannot appear anywhere else in that row or column outside the block!</p><p>Conversely, if a row or column has candidates for a digit only inside one block, those candidates cannot appear in any other cell of that block (Box-Line Reduction).</p>',
  2,
  '{"type":"pointing_demo"}',
  true,
  NOW(),
  NOW()
) ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "content" = EXCLUDED."content",
  "order" = EXCLUDED."order",
  "isPublished" = true,
  "updatedAt" = NOW();

-- 3. COURSE 3: Advanced Mastery (ADVANCED)
INSERT INTO "Course" ("id", "slug", "title", "description", "level", "order", "isPublished", "createdAt", "updatedAt")
VALUES (
  'crs_adv_001',
  'advanced-mastery',
  'Advanced Mastery: Wings, Fish & Chains',
  'Conquer expert and nightmare difficulty puzzles using X-Wings, Swordfish, and XY-Wing chain tactics.',
  'ADVANCED',
  3,
  true,
  NOW(),
  NOW()
) ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "level" = EXCLUDED."level",
  "order" = EXCLUDED."order",
  "isPublished" = true,
  "updatedAt" = NOW();

-- Module 3.1
INSERT INTO "Module" ("id", "courseId", "title", "description", "order", "createdAt", "updatedAt")
VALUES (
  'mod_adv_001',
  (SELECT "id" FROM "Course" WHERE "slug" = 'advanced-mastery'),
  'Single-Digit Fish Patterns',
  'Discover rectangular conjugate pairings that clear candidates across parallel houses.',
  1,
  NOW(),
  NOW()
) ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "order" = EXCLUDED."order",
  "updatedAt" = NOW();

-- Lesson 3.1.1
INSERT INTO "Lesson" ("id", "moduleId", "slug", "title", "content", "order", "interactive", "isPublished", "createdAt", "updatedAt")
VALUES (
  'lsn_adv_001',
  'mod_adv_001',
  'x-wing-strategy',
  'The X-Wing Pattern: Two Rows, Two Columns',
  '<h2>The Anatomy of an X-Wing</h2><p>An <strong>X-Wing</strong> is formed when a candidate digit appears exactly twice in two different rows, and those candidate cells align in the <em>same two columns</em>, creating a rectangular shape.</p><p>Because the digit must occupy either the top-left and bottom-right corners OR the top-right and bottom-left corners, <strong>no other cells in those two columns can contain that digit</strong>.</p>',
  1,
  '{"type":"xwing_demo"}',
  true,
  NOW(),
  NOW()
) ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "content" = EXCLUDED."content",
  "order" = EXCLUDED."order",
  "isPublished" = true,
  "updatedAt" = NOW();
