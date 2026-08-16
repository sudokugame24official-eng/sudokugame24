"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  HelpCircle,
  Play,
  User,
  Users,
  Book,
  Swords,
  Shield,
  Settings,
  Search,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { Link } from "@/navigation";

type Article = {
  question: string;
  answer: string;
};

type Category = {
  id: string;
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  articles: Article[];
};

const HELP_CONTENT: Category[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: <Play className="w-6 h-6" />,
    iconColor: "text-brand-cyan",
    articles: [
      {
        question: "What is Sudoku?",
        answer:
          "Sudoku is a logic-based number-placement puzzle. The goal is to fill a 9×9 grid with digits 1–9 so that each row, each column, and each of the nine 3×3 boxes contains every digit exactly once. No math is required — only logical deduction.",
      },
      {
        question: "How do I play Sudoku?",
        answer:
          "Click any empty cell on the grid, then press a number key (1–9) or tap a number on the on-screen pad. The grid highlights matching numbers and related cells to help you. If you place a wrong number, the cell turns red. Use the Eraser button to clear a cell.",
      },
      {
        question: "How does the platform work?",
        answer:
          "Sudoku Premium offers multiple game modes: Solo play (Easy to Master), a shared Daily Challenge, and real-time 1v1 Multiplayer Duels. Your progress, XP, and ranking are tracked on your profile. Join the Forum to discuss strategies with the community.",
      },
      {
        question: "Do I need an account?",
        answer:
          "No — you can play Solo puzzles as a guest immediately. However, creating a free account enables stat tracking, daily streaks, leaderboard ranking, duels, friends, messages, and achievements.",
      },
      {
        question: "Can I play Sudoku for free?",
        answer:
          "Yes. All Solo puzzles and Daily Challenges are completely free. Multiplayer Duel is also free. The optional Shop (launching soon) will offer cosmetic items only and will never put gameplay behind a paywall.",
      },
    ],
  },
  {
    id: "gameplay",
    title: "Gameplay",
    icon: <Book className="w-6 h-6" />,
    iconColor: "text-brand-orange",
    articles: [
      {
        question: "How does Sudoku scoring work?",
        answer:
          "In Solo mode, your score reflects how quickly and accurately you complete a puzzle. In the Daily Challenge, each correctly placed number earns you Coins. In Duels, correct placements score +1 point and incorrect ones cost -1 point.",
      },
      {
        question: "What happens when I make a mistake?",
        answer:
          "In Solo mode, you have 3 mistake allowances. After 3 incorrect placements, the game ends. The incorrect cell is highlighted in red. In Duel mode, mistakes are penalized immediately with a -1 score deduction.",
      },
      {
        question: "Can I use notes or pencil marks?",
        answer:
          "Yes. Click the pencil/notes icon to toggle candidate mode. In this mode, numbers you press are placed as small pencil marks rather than final values. This is essential for intermediate and advanced solving.",
      },
      {
        question: "How does the timer work?",
        answer:
          "Solo mode uses a count-up timer — how long it takes you to complete the puzzle. The Daily Challenge uses a countdown timer (2 minutes). Faster solo completion times are ranked on leaderboards.",
      },
      {
        question: "Can I pause a game?",
        answer:
          "Yes. In Solo mode, click the Pause button in the game header. The grid will be hidden while paused to prevent cheating. The timer pauses as well.",
      },
      {
        question: "How do hints work?",
        answer:
          "Hints reveal one correct cell on the grid. They are available in practice mode and come at a small cost in competitive modes. The number of hints available depends on your mode.",
      },
      {
        question: "How do I restart a puzzle?",
        answer:
          "Click the Settings or Restart icon in the game header. You will be asked to confirm — restarting resets all your placed numbers and the timer. In Duel mode, you cannot restart.",
      },
    ],
  },
  {
    id: "daily-challenge",
    title: "Daily Challenge",
    icon: <Shield className="w-6 h-6" />,
    iconColor: "text-brand-gold",
    articles: [
      {
        question: "What is the Daily Challenge?",
        answer:
          "Every day at midnight (UTC), a new puzzle is published for all players globally. Everyone solves the exact same puzzle. Your time is posted to the Daily Leaderboard. There is one official attempt per day.",
      },
      {
        question: "How does the daily streak work?",
        answer:
          "Your streak increases by 1 each day you complete the Daily Challenge. Miss a day and your streak resets to zero. Streaks are displayed on your profile and longer streaks earn special badges.",
      },
      {
        question: "Can I play the Daily Challenge more than once?",
        answer:
          "You get one official attempt per day. Once submitted (win or lose), your result is final for that day. You can practice the puzzle afterward without it affecting your score or streak.",
      },
      {
        question: "How is the Daily Leaderboard calculated?",
        answer:
          "Players are ranked by time taken to complete the puzzle. Tie-breakers are resolved by fewest mistakes. If you don't complete the puzzle, you won't appear on the leaderboard for that day.",
      },
    ],
  },
  {
    id: "duel",
    title: "Multiplayer Duel",
    icon: <Swords className="w-6 h-6" />,
    iconColor: "text-red-400",
    articles: [
      {
        question: "How does 1v1 Sudoku Duel work?",
        answer:
          "Both players are matched and given the exact same Sudoku grid. You solve it simultaneously in real time. Your cells appear in your color, your opponent's in theirs. Each correct cell earns +1 point; each incorrect placement costs -1 point. The player with the highest score when the grid is complete wins.",
      },
      {
        question: "How does matchmaking work?",
        answer:
          'Our skill-based matchmaking system pairs you with opponents of similar Elo rating. Queue up by clicking "Find Opponent" — you will usually be matched within seconds.',
      },
      {
        question: "How does the Battle Bar work?",
        answer:
          "The Battle Bar at the center of the duel screen dynamically shows the score difference between you and your opponent. As you earn points, the bar shifts toward your side. It's a live, visual representation of who is currently winning.",
      },
      {
        question: "What happens if I disconnect during a Duel?",
        answer:
          "If you disconnect, you have a short grace period to reconnect. If you cannot reconnect in time, the match is forfeited and you lose the Elo points. A stable internet connection is strongly recommended.",
      },
      {
        question: "Can I rematch after a Duel?",
        answer:
          'Yes. After any match ends, you will see a "Rematch" button on the result screen. Both players must confirm the rematch for a new game to begin. If the opponent declines, you\'ll be returned to the matchmaking queue.',
      },
    ],
  },
  {
    id: "account",
    title: "Account & Profile",
    icon: <User className="w-6 h-6" />,
    iconColor: "text-purple-400",
    articles: [
      {
        question: "How do I create an account?",
        answer:
          "Click the avatar icon in the top right header or go to the Sign Up page. You can register with your email address. Once registered, you can complete your profile and start tracking your stats.",
      },
      {
        question: "How do I edit my profile?",
        answer:
          'Go to your Profile page and click the "Edit Profile" button. You can update your username, avatar, and bio from there.',
      },
      {
        question: "How do I change my username?",
        answer:
          "Your username can be changed in Account Settings. Usernames must be unique. Note: Frequent username changes may be rate-limited to prevent confusion in the community.",
      },
      {
        question: "How do I reset my password?",
        answer:
          'On the login page, click "Forgot Password?" and enter your email. You will receive a secure reset link. The link expires after 24 hours.',
      },
      {
        question: "How do I delete my account?",
        answer:
          'Account deletion is available in your Account Settings under "Danger Zone". This action is irreversible. All your data, including stats, friends, and achievements, will be permanently erased.',
      },
    ],
  },
  {
    id: "community",
    title: "Community & Social",
    icon: <Users className="w-6 h-6" />,
    iconColor: "text-brand-cyan",
    articles: [
      {
        question: "How does the Forum work?",
        answer:
          "The Forum is a community space to discuss Sudoku strategies, ask for help, and share achievements. Topics are organized by category. You need a free account to post.",
      },
      {
        question: "How do I create a forum topic?",
        answer:
          'Go to the Forum page and click "+ New Discussion". Select a category, write a title and your message, then publish. Keep titles clear and specific so others can find and help you.',
      },
      {
        question: "How do I add friends?",
        answer:
          'Visit any player\'s profile (from the leaderboard or forum) and click "Add Friend". Once they accept, you can message them and challenge them directly to a duel.',
      },
      {
        question: "How do I block or report someone?",
        answer:
          'On a user\'s profile or in the chat, click the three-dot menu and select "Block" or "Report". Blocked users cannot contact you or challenge you to duels. Reports are reviewed by our moderation team.',
      },
    ],
  },
];

export default function HelpPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openArticle, setOpenArticle] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = HELP_CONTENT.map((cat) => ({
    ...cat,
    articles: cat.articles.filter(
      (a) =>
        !searchTerm ||
        a.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.answer.toLowerCase().includes(searchTerm.toLowerCase()),
    ),
  })).filter((cat) => cat.articles.length > 0);

  const displayedCategories =
    activeCategory && !searchTerm
      ? filtered.filter((c) => c.id === activeCategory)
      : filtered;

  return (
    <div className="min-h-screen bg-brand-navy text-white">
      {/* Hero */}
      <section className="py-16 px-4 text-center border-b border-white/10 bg-gradient-to-b from-brand-navy-lighter/30 to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand-gold/10 text-brand-gold px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest mb-6 border border-brand-gold/20">
            <HelpCircle className="w-4 h-4" /> Help Center
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            How Can We <span className="text-brand-gold">Help?</span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Find answers about gameplay, your account, the community, and
            everything else about Sudoku Premium.
          </p>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search help articles..."
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

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Category Navigation */}
        {!searchTerm && (
          <div className="flex flex-wrap gap-2 mb-10">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-xl text-sm font-bold tracking-wide transition-all ${!activeCategory ? "bg-brand-orange text-white shadow-[0_4px_0_#CC3700]" : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"}`}
            >
              All Topics
            </button>
            {HELP_CONTENT.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  setActiveCategory(cat.id === activeCategory ? null : cat.id)
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold tracking-wide transition-all ${activeCategory === cat.id ? "bg-brand-gold text-brand-navy shadow-[0_4px_0_#B38F00]" : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"}`}
              >
                <span
                  className={activeCategory === cat.id ? "" : cat.iconColor}
                >
                  {cat.icon}
                </span>
                {cat.title}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {displayedCategories.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-3xl border border-white/10">
            <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No matching articles</h3>
            <p className="text-gray-400 mb-6">
              We couldn't find anything for "{searchTerm}".
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <button
                onClick={() => setSearchTerm("")}
                className="px-5 py-2.5 bg-brand-orange text-white font-bold rounded-xl uppercase tracking-widest shadow-[0_4px_0_#CC3700]"
              >
                Clear Search
              </button>
              <Link href="/contact">
                <button className="px-5 py-2.5 border border-white/20 text-white font-bold rounded-xl uppercase tracking-widest hover:bg-white/10 transition-colors">
                  Contact Support
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {displayedCategories.map((cat) => (
              <div key={cat.id}>
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className={`w-10 h-10 rounded-xl bg-brand-navy-lighter flex items-center justify-center ${cat.iconColor}`}
                  >
                    {cat.icon}
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-wide">
                    {cat.title}
                  </h2>
                </div>
                <div className="space-y-2">
                  {cat.articles.map((article) => {
                    const key = `${cat.id}-${article.question}`;
                    const isOpen = openArticle === key;
                    return (
                      <motion.div
                        key={key}
                        layout
                        className="bg-brand-navy-light border border-white/10 rounded-2xl overflow-hidden"
                      >
                        <button
                          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                          onClick={() => setOpenArticle(isOpen ? null : key)}
                          aria-expanded={isOpen}
                        >
                          <span className="font-bold pr-4">
                            {article.question}
                          </span>
                          <ChevronDown
                            className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-brand-gold" : "text-gray-500"}`}
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              key="body"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="px-6 pb-5 text-gray-300 leading-relaxed border-t border-white/5 pt-4">
                                {article.answer}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact Strip */}
        <div className="mt-16 bg-brand-navy-light border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <MessageSquare className="w-10 h-10 text-brand-cyan shrink-0" />
            <div>
              <h3 className="text-xl font-black">Still need help?</h3>
              <p className="text-gray-400">
                Our support team usually responds within 24 hours.
              </p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap justify-center md:justify-end">
            <Link href="/forum">
              <button className="flex items-center gap-2 px-5 py-3 border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 transition-colors">
                <Users className="w-4 h-4" /> Ask the Community
              </button>
            </Link>
            <Link href="/contact">
              <button className="flex items-center gap-2 px-5 py-3 bg-brand-orange text-white font-bold rounded-xl uppercase tracking-widest shadow-[0_4px_0_#CC3700] hover:brightness-110">
                Contact Support
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
