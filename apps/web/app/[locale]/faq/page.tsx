"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Search,
  HelpCircle,
  Play,
  BookOpen,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { Link } from "@/navigation";

const FAQ_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [] as any[],
};

const faqs = [
  // General Sudoku
  {
    category: "General Sudoku",
    question: "What is Sudoku?",
    answer:
      "Sudoku is a logic-based number-placement puzzle. The objective is to fill a 9×9 grid with digits (1–9) so that each column, each row, and each of the nine 3×3 subgrids contain every digit exactly once. Despite using numbers, it requires no arithmetic — only pure logical reasoning.",
  },
  {
    category: "General Sudoku",
    question: "What are the basic rules of Sudoku?",
    answer:
      "There is exactly one rule: every row, every column, and every 3×3 box must contain the digits 1 through 9 exactly once. No digit can repeat within any row, column, or box.",
  },
  {
    category: "General Sudoku",
    question: "Can a Sudoku puzzle have more than one solution?",
    answer:
      "A well-formed Sudoku puzzle always has exactly one unique solution. If a puzzle has multiple solutions, it is considered flawed. Every puzzle on this platform is algorithmically verified to have exactly one solution.",
  },
  {
    category: "General Sudoku",
    question: "Is Sudoku good for your brain?",
    answer:
      "Yes. Regular Sudoku practice improves logical reasoning, concentration, memory, and pattern recognition. Studies suggest it can help reduce cognitive decline and is an excellent mental workout for all ages.",
  },
  {
    category: "General Sudoku",
    question: "Do I need to be good at math to play Sudoku?",
    answer:
      "Not at all. Sudoku is purely a logic puzzle. The numbers 1–9 could be replaced with colors or letters and the puzzle would work identically. No arithmetic is required.",
  },
  {
    category: "General Sudoku",
    question: "Can I play Sudoku online for free?",
    answer:
      "Yes. Sudoku Premium offers unlimited free puzzles across all difficulty levels, including daily challenges and real-time multiplayer duels — all completely free.",
  },

  // Beginner
  {
    category: "Beginner",
    question: "How do I start solving a Sudoku puzzle?",
    answer:
      "Start by scanning rows, columns, and boxes for cells that can only contain one possible number. Look for rows or columns that are already mostly filled — the missing numbers are more constrained. Fill in the certain numbers first before using pencil marks.",
  },
  {
    category: "Beginner",
    question: "What is a naked single in Sudoku?",
    answer:
      "A naked single (also called a sole candidate) is when a cell has only one possible number remaining. All other digits 1–9 are already present in its row, column, or box. This is the first and most fundamental technique.",
  },
  {
    category: "Beginner",
    question: "What is a hidden single in Sudoku?",
    answer:
      "A hidden single is when a specific number can only go in one specific cell within a row, column, or 3×3 box — even if that cell appears to have multiple candidates. Scanning for 'where can this number go in this box?' reveals hidden singles.",
  },
  {
    category: "Beginner",
    question: "What are pencil marks (candidates)?",
    answer:
      "Pencil marks are small numbers written in a cell to track which digits are still possible for that cell. They are essential for intermediate and advanced solving. Once you eliminate enough candidates through logic, you can place the confirmed digit.",
  },
  {
    category: "Beginner",
    question: "What should I do when I get stuck on Sudoku?",
    answer:
      "First, review every row, column, and box systematically for naked singles. Then enable pencil marks and look for hidden singles. If still stuck, look for naked pairs or pointing pairs. Our Academy covers each technique step-by-step.",
  },

  // Advanced Strategies
  {
    category: "Advanced Strategies",
    question: "What is an X-Wing in Sudoku?",
    answer:
      "The X-Wing is an advanced elimination technique. It applies when a specific candidate number appears in exactly two cells in two different rows, and both rows share the same two columns. This forms an 'X' shape. You can safely eliminate that candidate from all other cells in those two columns.",
  },
  {
    category: "Advanced Strategies",
    question: "What is Swordfish in Sudoku?",
    answer:
      "Swordfish is the 3-row extension of the X-Wing technique. It occurs when a candidate appears in exactly 2–3 cells across three rows, and these positions are confined to just three columns (or vice versa). The candidate can then be eliminated from the rest of those columns.",
  },
  {
    category: "Advanced Strategies",
    question: "What is an XY-Wing?",
    answer:
      "An XY-Wing uses three bi-value cells (cells with exactly two candidates) in a chain. The 'pivot' cell shares one candidate with each of the two 'wings'. Any cell that sees both wings can have the shared candidate eliminated from it.",
  },
  {
    category: "Advanced Strategies",
    question: "What is the difference between X-Wing and Swordfish?",
    answer:
      "X-Wing uses exactly 2 rows and 2 columns. Swordfish uses 3 rows and 3 columns. Jellyfish extends this to 4 rows and 4 columns. They are all 'fish' patterns, each increasing in complexity.",
  },
  {
    category: "Advanced Strategies",
    question: "How can I solve Sudoku faster?",
    answer:
      "1. Scan systematically — don't jump around randomly. 2. Use pencil marks consistently. 3. Always check rows, columns, and boxes for hidden singles before trying complex techniques. 4. Practice recognizing patterns like naked pairs visually. Speed comes from consistent technique, not rushing.",
  },

  // Online Sudoku & Platform
  {
    category: "Online Sudoku",
    question: "How does online Sudoku scoring work?",
    answer:
      "In Solo mode, you are graded on time and mistake count. Fewer mistakes and faster completion means a higher score. In Multiplayer Duel, you earn +1 for each correct cell and -1 for each incorrect placement. The player with the higher score when the grid is complete wins.",
  },
  {
    category: "Online Sudoku",
    question: "How does the Daily Sudoku Challenge work?",
    answer:
      "Every day at midnight, a new puzzle is published globally. Every player solves the exact same puzzle. You get one attempt to set your best time. Complete it daily to build your streak. Daily leaderboards reset each day.",
  },
  {
    category: "Online Sudoku",
    question: "How does 1v1 Multiplayer Sudoku work?",
    answer:
      "You and your opponent are matched via skill-based matchmaking and placed on the exact same Sudoku grid. Correct cells earn +1 point and incorrect placements cost -1 point. The Battle Bar shows who is leading in real time. The player with the highest score when the grid is solved wins.",
  },
  {
    category: "Online Sudoku",
    question: "How is Sudoku ranking (Elo) calculated?",
    answer:
      "We use an Elo rating system similar to chess. Winning against a higher-rated opponent gives more points; losing to a lower-rated opponent costs more points. Your rating accurately reflects your skill level relative to the entire player base.",
  },

  // Daily Challenge
  {
    category: "Daily Challenge",
    question: "What is the Daily Challenge?",
    answer:
      "The Daily Challenge is a single, globally shared puzzle published every day. Every player worldwide solves the exact same puzzle. Your time and accuracy are compared against all other participants on the Daily Leaderboard.",
  },
  {
    category: "Daily Challenge",
    question: "How does the daily streak work?",
    answer:
      "Your streak increases by one for every consecutive day you complete the Daily Challenge. Miss a day and your streak resets to zero. Maintaining long streaks earns you special badges and recognition on your profile.",
  },
  {
    category: "Daily Challenge",
    question: "Can I play the Daily Challenge more than once?",
    answer:
      "You get one official attempt per day. After completing or failing, you can practice on the same puzzle, but only your first attempt counts toward the leaderboard and streak.",
  },

  // Account & Community
  {
    category: "Account & Community",
    question: "What is XP and how do levels work?",
    answer:
      "XP (Experience Points) are earned by solving puzzles, completing daily challenges, and winning duels. As you accumulate XP, your level increases. Higher levels unlock special profile badges and community recognition.",
  },
  {
    category: "Account & Community",
    question: "How do achievements work?",
    answer:
      "Achievements are milestones unlocked by reaching specific goals: completing 100 puzzles, winning 50 duels, maintaining a 30-day streak, and more. Each achievement appears on your profile and earns you XP.",
  },
  {
    category: "Account & Community",
    question: "How do I add a friend?",
    answer:
      "Visit any player's profile page and click 'Add Friend'. Once they accept, they will appear in your friends list. You can then message them or challenge them directly to a duel.",
  },
  {
    category: "Account & Community",
    question: "What are Coins?",
    answer:
      "Coins are the platform's virtual currency. They can be earned through gameplay (Daily Challenge rewards) and will be usable in the Shop to unlock cosmetic items like custom avatars, profile frames, and grid themes. The Shop launches soon.",
  },
];

FAQ_STRUCTURED_DATA.mainEntity = faqs.map((f) => ({
  "@type": "Question",
  name: f.question,
  acceptedAnswer: { "@type": "Answer", text: f.answer },
}));

const CATEGORIES = [...new Set(faqs.map((f) => f.category))];

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = faqs.filter((faq) => {
    const matchSearch =
      !searchTerm ||
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = !activeCategory || faq.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const grouped = filtered.reduce(
    (acc, faq) => {
      if (!acc[faq.category]) acc[faq.category] = [];
      acc[faq.category]!.push(faq);
      return acc;
    },
    {} as Record<string, typeof faqs>,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(FAQ_STRUCTURED_DATA),
        }}
      />
      <div className="min-h-screen bg-brand-navy text-white">
        {/* Hero */}
        <section className="py-16 px-4 text-center border-b border-white/10 bg-gradient-to-b from-brand-navy-lighter/30 to-transparent">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand-cyan/10 text-brand-cyan px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest mb-6 border border-brand-cyan/20">
              <HelpCircle className="w-4 h-4" /> Frequently Asked Questions
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
              Find Your <span className="text-brand-gold">Answer</span>
            </h1>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Everything you need to know about Sudoku rules, strategies, our
              platform, and competitive gameplay.
            </p>

            {/* Search */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions (e.g. X-Wing, Streak, Duel)..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-white/20 bg-white/5 text-white placeholder:text-gray-400 text-lg focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setActiveCategory(null);
                }}
              />
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Category Pills */}
          {!searchTerm && (
            <div className="flex flex-wrap gap-2 mb-10">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${!activeCategory ? "bg-brand-orange text-white shadow-[0_4px_0_#CC3700]" : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"}`}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    setActiveCategory(cat === activeCategory ? null : cat)
                  }
                  className={`px-4 py-2 rounded-xl text-sm font-bold tracking-wide transition-all ${activeCategory === cat ? "bg-brand-gold text-brand-navy shadow-[0_4px_0_#B38F00]" : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* FAQ Groups */}
          <div className="space-y-12">
            {Object.keys(grouped).length === 0 ? (
              <div className="text-center py-16 bg-white/5 rounded-3xl border border-white/10">
                <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  No matching questions
                </h3>
                <p className="text-gray-400 mb-6">
                  We couldn't find a question matching "{searchTerm}".
                </p>
                <div className="flex justify-center gap-3 flex-wrap">
                  <button
                    onClick={() => setSearchTerm("")}
                    className="px-5 py-2.5 bg-brand-orange text-white font-bold rounded-xl uppercase tracking-widest shadow-[0_4px_0_#CC3700]"
                  >
                    Clear Search
                  </button>
                  <Link href="/forum">
                    <button className="px-5 py-2.5 border border-white/20 text-white font-bold rounded-xl uppercase tracking-widest hover:bg-white/10 transition-colors">
                      Ask the Community
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              Object.entries(grouped).map(([category, questions]) => (
                <div key={category}>
                  <h2 className="text-xl font-black uppercase tracking-widest text-brand-gold mb-4 flex items-center gap-3">
                    <span className="w-8 h-0.5 bg-brand-gold/50 inline-block"></span>
                    {category}
                  </h2>
                  <div className="space-y-2">
                    {questions.map((faq) => {
                      const idx = faqs.indexOf(faq);
                      const isOpen = openIndex === idx;
                      return (
                        <motion.div
                          key={idx}
                          layout
                          className="bg-brand-navy-light border border-white/10 rounded-2xl overflow-hidden"
                        >
                          <button
                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                            onClick={() => setOpenIndex(isOpen ? null : idx)}
                            aria-expanded={isOpen}
                          >
                            <span className="font-bold text-base pr-4">
                              {faq.question}
                            </span>
                            <ChevronDown
                              className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-brand-gold" : "text-gray-500"}`}
                            />
                          </button>
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                key="content"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <div className="px-6 pb-5 text-gray-300 leading-relaxed border-t border-white/5 pt-3">
                                  {faq.answer}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Links */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Link href="/learn" className="group">
              <div className="bg-brand-navy-light border border-white/10 p-6 rounded-2xl hover:border-brand-cyan/40 transition-all text-center">
                <BookOpen className="w-8 h-8 text-brand-cyan mx-auto mb-3" />
                <h3 className="font-black uppercase mb-1">Sudoku Academy</h3>
                <p className="text-sm text-gray-400">
                  In-depth technique guides
                </p>
              </div>
            </Link>
            <Link href="/play" className="group">
              <div className="bg-brand-navy-light border border-white/10 p-6 rounded-2xl hover:border-brand-orange/40 transition-all text-center">
                <Play className="w-8 h-8 text-brand-orange mx-auto mb-3" />
                <h3 className="font-black uppercase mb-1">Practice Now</h3>
                <p className="text-sm text-gray-400">
                  Apply what you've learned
                </p>
              </div>
            </Link>
            <Link href="/forum" className="group">
              <div className="bg-brand-navy-light border border-white/10 p-6 rounded-2xl hover:border-brand-gold/40 transition-all text-center">
                <MessageSquare className="w-8 h-8 text-brand-gold mx-auto mb-3" />
                <h3 className="font-black uppercase mb-1">Ask Community</h3>
                <p className="text-sm text-gray-400">
                  Get answers from players
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
