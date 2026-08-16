import { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; difficulty: string }>;
}): Promise<Metadata> {
  const { difficulty } = await params;
  const validDifficulties = ["easy", "medium", "hard", "expert", "master"];

  if (!validDifficulties.includes(difficulty)) {
    return { title: "Not Found" };
  }

  const capitalized = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  return {
    title: `Play ${capitalized} Sudoku Online Free`,
    description: `Challenge yourself with our ${difficulty} Sudoku puzzles. Play online for free, track your time, and improve your logic skills.`,
    alternates: {
      canonical: `/sudoku/${difficulty}`,
    },
  };
}

export default async function DifficultyPage({
  params,
}: {
  params: Promise<{ locale: string; difficulty: string }>;
}) {
  const { difficulty } = await params;
  const validDifficulties = ["easy", "medium", "hard", "expert", "master"];

  if (!validDifficulties.includes(difficulty)) {
    notFound();
  }

  const capitalized = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

  return (
    <div className="flex flex-col items-center justify-center p-8 max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Play {capitalized} Sudoku Online
        </h1>
        <p className="text-muted-foreground text-lg">
          Master the {difficulty} difficulty and earn unique rewards. Our server
          guarantees fair puzzles generated in real-time.
        </p>
      </div>

      <div className="w-full bg-card border rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px]">
        {/* The Actual Grid Component would be mounted here */}
        <p className="text-muted-foreground italic">
          [Interactive {capitalized} Sudoku Grid Component Mounts Here]
        </p>
        <button className="mt-8 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 transition">
          Start {capitalized} Game
        </button>
      </div>

      <article className="prose prose-neutral dark:prose-invert max-w-none w-full">
        <h2>Why Play {capitalized} Sudoku?</h2>
        <p>
          Playing {difficulty} Sudoku is an excellent way to train your brain.
          As you progress through our difficulty tiers, you'll encounter puzzles
          that require advanced techniques such as X-Wings and Swordfishes.
        </p>
        {/* SEO Contextual Internal Links */}
        <div className="mt-8 flex gap-4">
          <a href="/en/learn" className="text-blue-500 hover:underline">
            Learn Sudoku Strategies
          </a>
          <a href="/en/duel" className="text-blue-500 hover:underline">
            Try Multiplayer Duel
          </a>
        </div>
      </article>
    </div>
  );
}
