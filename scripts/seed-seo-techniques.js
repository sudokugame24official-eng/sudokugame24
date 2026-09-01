const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Phase 1 Pilot Techniques...');

  // Ensure we have a default author (system or super_admin)
  let author = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  if (!author) {
    author = await prisma.user.create({
      data: {
        email: 'academy@sudokugame24.com',
        role: 'SUPER_ADMIN',
        profile: {
          create: {
            username: 'Sudoku Academy',
          }
        }
      }
    });
  }

  const techniques = [
    {
      slug: 'naked-singles',
      title: 'Naked Singles (Sole Candidate)',
      metaTitle: 'How to use Naked Singles in Sudoku | SudokuGame24',
      metaDescription: 'Learn the Naked Single (Sole Candidate) Sudoku technique. A complete beginner guide to finding cells with only one possible number.',
      excerpt: 'The Naked Single is the most fundamental Sudoku technique. If a cell has only one possible candidate left after checking its row, column, and box, you can safely place that number.',
      content: `<h2>What is a Naked Single?</h2>
<p>A Naked Single (also known as a Sole Candidate) occurs when a specific cell can only contain one possible number. This happens because all other 8 numbers (from 1 to 9) already exist in the same row, column, or 3x3 block.</p>
<h2>How to spot a Naked Single</h2>
<p>To find a Naked Single, you need to look at a single empty cell and scan its three "houses":</p>
<ol>
<li>The row it belongs to.</li>
<li>The column it belongs to.</li>
<li>The 3x3 box it sits in.</li>
</ol>
<p>If you count the unique numbers present in those three areas and find 8 different digits, the missing 9th digit must go into your empty cell.</p>
<h2>Common Mistakes</h2>
<p>Beginners often guess numbers when they are stuck. A Naked Single is a deduction of certainty, not a guess. Always verify all three dimensions (row, column, block) before writing down the number.</p>`,
      type: 'BLOG',
      category: 'technique',
      tags: ['beginner', 'easy', 'technique'],
    },
    {
      slug: 'hidden-singles',
      title: 'Hidden Singles',
      metaTitle: 'Hidden Singles Sudoku Technique | SudokuGame24',
      metaDescription: 'Master the Hidden Single technique. Learn how to find the only possible cell for a specific number in a Sudoku block, row, or column.',
      excerpt: 'A Hidden Single occurs when a number can only be placed in one specific cell within a row, column, or block, even though that cell might have other candidates.',
      content: `<h2>What is a Hidden Single?</h2>
<p>While a Naked Single is about a cell that can only take one number, a Hidden Single is about a number that can only go into one cell within a specific region (row, column, or box).</p>
<h2>How to find Hidden Singles</h2>
<p>Focus on one number at a time (e.g., all the 7s on the board). Scan a 3x3 box that is missing a 7. Look at the existing 7s in the intersecting rows and columns. If their alignment eliminates all empty cells in the 3x3 box except for one, you have found a Hidden Single!</p>
<h2>Why is it "Hidden"?</h2>
<p>It is called "hidden" because the cell itself might technically allow other numbers if you only look at it in isolation. But because no other cell in that region can take the target number, it must be placed there.</p>`,
      type: 'BLOG',
      category: 'technique',
      tags: ['beginner', 'easy', 'technique'],
    },
    {
      slug: 'naked-pairs',
      title: 'Naked Pairs',
      metaTitle: 'Naked Pairs Sudoku Strategy Explained | SudokuGame24',
      metaDescription: 'Learn how to use Naked Pairs to eliminate candidates in Sudoku. A step-by-step intermediate strategy guide.',
      excerpt: 'When two cells in the same row, column, or block contain exactly the same two candidates (and no others), you can eliminate those two numbers from all other cells in that region.',
      content: `<h2>What is a Naked Pair?</h2>
<p>A Naked Pair occurs when two cells in the exact same region (row, column, or 3x3 box) contain exactly the same two candidates, and no other candidates. Because those two cells must contain those two numbers in some order, those numbers cannot appear anywhere else in that region.</p>
<h2>How to use Naked Pairs</h2>
<p>If you find a Naked Pair, you don't instantly solve those two cells, but you gain a powerful elimination tool. You can safely erase those two numbers from the pencil marks of every other cell in the same row, column, or block.</p>
<h2>Example</h2>
<p>If cells A1 and A2 both contain only the candidates [3, 7], no other cell in Row A can be a 3 or a 7. You can safely cross them out.</p>`,
      type: 'BLOG',
      category: 'technique',
      tags: ['medium', 'technique'],
    },
    {
      slug: 'pointing-pairs',
      title: 'Pointing Pairs (Intersection Removal)',
      metaTitle: 'Pointing Pairs Sudoku Technique | SudokuGame24',
      metaDescription: 'Master the Pointing Pairs technique. Learn how to eliminate candidates when a number is restricted to a single row or column within a block.',
      excerpt: 'If a candidate number only appears in one row or column within a 3x3 block, you can eliminate that number from the rest of that entire row or column outside the block.',
      content: `<h2>What is a Pointing Pair?</h2>
<p>Pointing Pairs (sometimes called Pointing Candidates or Intersection Removal) happen when the only possible locations for a specific number within a 3x3 box align perfectly in a single row or column.</p>
<h2>How it works</h2>
<p>Since the number MUST be placed somewhere within the 3x3 box, and all possible spots for it are on the same line, the number is guaranteed to be on that line inside the box. Therefore, that number cannot exist anywhere else on that entire line outside the box.</p>
<h2>Strategic Value</h2>
<p>Pointing Pairs are essential for solving medium to hard Sudokus. They help clean up your pencil marks, often revealing Naked Singles or Pairs that were previously hidden by too many candidates.</p>`,
      type: 'BLOG',
      category: 'technique',
      tags: ['medium', 'technique'],
    },
    {
      slug: 'x-wing-sudoku',
      title: 'X-Wing Technique',
      metaTitle: 'X-Wing Sudoku Technique: Step-by-Step Guide | SudokuGame24',
      metaDescription: 'Learn the advanced X-Wing Sudoku technique. Discover how to find and apply X-Wings to solve hard and expert Sudoku puzzles.',
      excerpt: 'The X-Wing is an advanced technique used when a candidate only appears twice in two different rows, and they align in the exact same columns. This allows for massive candidate elimination.',
      content: `<h2>What is an X-Wing?</h2>
<p>The X-Wing is a classic advanced Sudoku strategy. It looks for a specific pattern where a candidate number is restricted to exactly two cells in two different rows, and those cells share the same two columns (forming a rectangle or an "X").</p>
<h2>The Logic behind X-Wing</h2>
<p>Because the number can only appear twice in Row 1 (at Col A and Col B) and twice in Row 2 (at Col A and Col B), the true locations of the number must form a diagonal cross. It will either be (Row 1 Col A AND Row 2 Col B) OR (Row 1 Col B AND Row 2 Col A).</p>
<p>In both scenarios, Column A and Column B will definitely contain the number. Therefore, you can eliminate that candidate from all other cells in Column A and Column B!</p>
<h2>When to look for it</h2>
<p>Start looking for X-Wings when you are playing Hard or Expert Sudokus and basic techniques like Naked Pairs or Pointing Pairs no longer yield any eliminations.</p>`,
      type: 'BLOG',
      category: 'technique',
      tags: ['hard', 'expert', 'technique', 'x-wing'],
    }
  ];

  for (const t of techniques) {
    const existing = await prisma.contentArticle.findUnique({
      where: { slug: t.slug }
    });

    if (!existing) {
      await prisma.contentArticle.create({
        data: {
          slug: t.slug,
          locale: 'en',
          title: t.title,
          metaTitle: t.metaTitle,
          metaDescription: t.metaDescription,
          excerpt: t.excerpt,
          content: t.content,
          type: t.type,
          category: t.category,
          tags: t.tags,
          status: 'PUBLISHED',
          indexable: true,
          noIndex: false,
          authorId: author.id,
          publishedAt: new Date(),
        }
      });
      console.log(`✅ Created technique: ${t.slug}`);
    } else {
      console.log(`ℹ️ Technique already exists: ${t.slug}`);
    }
  }

  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
