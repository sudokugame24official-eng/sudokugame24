import { Link } from "@/navigation";
import {
  BookOpen,
  Target,
  Zap,
  Trophy,
  Play,
  ChevronRight,
  Clock,
  Star,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function LearnPage() {
  const t = useTranslations("learn");
  const tPlay = useTranslations("common");

  const levels = [
    {
      key: "beginner",
      label: t("beginner"),
      color: "border-green-500/40 hover:border-green-500",
      accent: "text-green-400",
      bg: "bg-green-500/10",
      icon: <BookOpen className="w-6 h-6" />,
      description: t("beginnerDesc"),
      articles: [
        {
          slug: "rules",
          title: t("articles.rules.title"),
          time: t("minRead", { n: 3 }),
          desc: t("articles.rules.desc"),
        },
        {
          slug: "how-to-play",
          title: t("articles.how-to-play.title"),
          time: t("minRead", { n: 5 }),
          desc: t("articles.how-to-play.desc"),
        },
        {
          slug: "candidates",
          title: t("articles.candidates.title"),
          time: t("minRead", { n: 4 }),
          desc: t("articles.candidates.desc"),
        },
        {
          slug: "naked-singles",
          title: t("articles.naked-singles.title"),
          time: t("minRead", { n: 3 }),
          desc: t("articles.naked-singles.desc"),
        },
        {
          slug: "hidden-singles",
          title: t("articles.hidden-singles.title"),
          time: t("minRead", { n: 4 }),
          desc: t("articles.hidden-singles.desc"),
        },
      ],
    },
    {
      key: "intermediate",
      label: t("intermediate"),
      color: "border-brand-gold/40 hover:border-brand-gold",
      accent: "text-brand-gold",
      bg: "bg-brand-gold/10",
      icon: <Target className="w-6 h-6" />,
      description: t("intermediateDesc"),
      articles: [
        {
          slug: "naked-pairs",
          title: t("articles.naked-pairs.title"),
          time: t("minRead", { n: 6 }),
          desc: t("articles.naked-pairs.desc"),
        },
        {
          slug: "hidden-pairs",
          title: t("articles.hidden-pairs.title"),
          time: t("minRead", { n: 5 }),
          desc: t("articles.hidden-pairs.desc"),
        },
        {
          slug: "naked-triples",
          title: t("articles.naked-triples.title"),
          time: t("minRead", { n: 6 }),
          desc: t("articles.naked-triples.desc"),
        },
        {
          slug: "pointing-pairs",
          title: t("articles.pointing-pairs.title"),
          time: t("minRead", { n: 5 }),
          desc: t("articles.pointing-pairs.desc"),
        },
        {
          slug: "box-line",
          title: t("articles.box-line.title"),
          time: t("minRead", { n: 5 }),
          desc: t("articles.box-line.desc"),
        },
      ],
    },
    {
      key: "advanced",
      label: t("advanced"),
      color: "border-brand-orange/40 hover:border-brand-orange",
      accent: "text-brand-orange",
      bg: "bg-brand-orange/10",
      icon: <Zap className="w-6 h-6" />,
      description: t("advancedDesc"),
      articles: [
        {
          slug: "x-wing",
          title: t("articles.x-wing.title"),
          time: t("minRead", { n: 8 }),
          desc: t("articles.x-wing.desc"),
        },
        {
          slug: "swordfish",
          title: t("articles.swordfish.title"),
          time: t("minRead", { n: 9 }),
          desc: t("articles.swordfish.desc"),
        },
        {
          slug: "xy-wing",
          title: t("articles.xy-wing.title"),
          time: t("minRead", { n: 8 }),
          desc: t("articles.xy-wing.desc"),
        },
        {
          slug: "unique-rectangle",
          title: t("articles.unique-rectangle.title"),
          time: t("minRead", { n: 7 }),
          desc: t("articles.unique-rectangle.desc"),
        },
        {
          slug: "chains",
          title: t("articles.chains.title"),
          time: t("minRead", { n: 12 }),
          desc: t("articles.chains.desc"),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-brand-navy text-white">
      {/* Hero */}
      <section className="py-16 px-4 text-center bg-gradient-to-b from-brand-navy-lighter/30 to-brand-navy border-b border-white/10">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand-cyan/10 text-brand-cyan px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest mb-6 border border-brand-cyan/20">
            <BookOpen className="w-4 h-4" /> {t("badge")}
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-none">
            {t("h1Part1")}
            <br />
            <span className="text-brand-gold">{t("h1Part2")}</span>
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* Level Cards */}
      <section className="max-w-6xl mx-auto px-4 py-16 space-y-10">
        {levels.map((level) => (
          <div
            key={level.key}
            className={`border rounded-3xl overflow-hidden bg-brand-navy-light transition-all ${level.color}`}
          >
            {/* Level Header */}
            <div
              className={`${level.bg} px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full bg-brand-navy flex items-center justify-center ${level.accent}`}
                >
                  {level.icon}
                </div>
                <div>
                  <h2
                    className={`text-2xl font-black uppercase tracking-wide ${level.accent}`}
                  >
                    {level.label}
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    {level.description}
                  </p>
                </div>
              </div>
              <Link href={`/learn/${level.key}`}>
                <button
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border ${level.color} ${level.accent} hover:bg-white/5 transition-colors`}
                >
                  {t("allGuides", { level: level.label })}{" "}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            {/* Article List */}
            <div className="divide-y divide-white/5">
              {level.articles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/learn/${article.slug}`}
                  className="group block"
                >
                  <div className="flex items-center justify-between px-8 py-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-2 h-2 rounded-full ${level.accent.replace("text-", "bg-")}`}
                      ></div>
                      <div>
                        <p className="font-bold text-white group-hover:text-brand-gold transition-colors">
                          {article.title}
                        </p>
                        <p className="text-sm text-gray-400 mt-0.5">
                          {article.desc}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500 shrink-0">
                      <span className="text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {article.time}
                      </span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 group-hover:text-brand-gold transition-all" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Bottom CTA */}
      <section className="max-w-4xl mx-auto px-4 pb-20 text-center">
        <div className="bg-brand-navy-light border border-brand-orange/30 rounded-3xl p-10 shadow-[0_0_40px_rgba(255,69,0,0.1)]">
          <Trophy className="w-12 h-12 text-brand-gold mx-auto mb-4" />
          <h2 className="text-3xl font-black mb-4 uppercase">
            {t("readyTitle")}
          </h2>
          <p className="text-gray-300 mb-8">{t("readyDesc")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/play">
              <button className="flex items-center gap-2 px-8 py-4 bg-brand-orange text-white font-black rounded-xl uppercase tracking-widest shadow-[0_4px_0_#CC3700] active:translate-y-1 active:shadow-none transition-all hover:brightness-110">
                <Play className="w-5 h-5" /> {t("playEasy")}
              </button>
            </Link>
            <Link href="/duel">
              <button className="flex items-center gap-2 px-8 py-4 border-2 border-brand-gold text-brand-gold font-black rounded-xl uppercase tracking-widest hover:bg-brand-gold hover:text-brand-navy transition-all">
                <Star className="w-5 h-5" /> {t("tryDuel")}
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
