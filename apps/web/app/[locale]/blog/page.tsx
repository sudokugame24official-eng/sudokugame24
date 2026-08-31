import { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Calendar, Clock, ChevronRight, Zap, Trophy, Shield, HelpCircle } from "lucide-react";
import { BLOG_ARTICLES } from "@/lib/blog-data";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isFr = locale === "fr";
  const isDe = locale === "de";

  const title = isFr 
    ? "Le Blog Officiel Sudoku | Astuces, Stratégies & Tutoriels" 
    : isDe 
      ? "Offizieller Sudoku Blog | Tipps, Strategien & Tutorials"
      : "The Official Sudoku Blog | Tips, Strategies & Tutorials";

  const description = isFr 
    ? "Découvrez nos 20 guides complets pour devenir un maître du Sudoku. Techniques avancées (X-Wing, Swordfish), conseils pour les duels 1v1, et bien plus."
    : isDe 
      ? "Entdecken Sie unsere 20 umfassenden Leitfäden, um ein Sudoku-Meister zu werden. Fortgeschrittene Techniken, Tipps für 1v1-Duelle und mehr."
      : "Discover our 20 comprehensive guides to becoming a Sudoku master. Advanced techniques (X-Wing, Swordfish), tips for 1v1 duels, and much more.";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sudokugame24.com";

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}/blog`,
      languages: {
        en: `${siteUrl}/en/blog`,
        fr: `${siteUrl}/fr/blog`,
        de: `${siteUrl}/de/blog`,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${siteUrl}/${locale}/blog`,
    },
  };
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const currentLang = (["en", "fr", "de"].includes(locale) ? locale : "en") as "en" | "fr" | "de";
  const posts = BLOG_ARTICLES;
  
  const tTitle = currentLang === "fr" ? "Le Blog Sudoku" : currentLang === "de" ? "Der Sudoku Blog" : "The Sudoku Blog";
  const tSubtitle = currentLang === "fr" 
    ? "Actualités, stratégies avancées et astuces pour dominer les classements." 
    : currentLang === "de" 
      ? "Neuigkeiten, fortgeschrittene Strategien und Tipps, um die Ranglisten zu dominieren."
      : "News, advanced strategies, and tips to dominate the leaderboards.";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": tTitle,
    "description": tSubtitle,
    "url": `https://sudokugame24.com/${locale}/blog`,
    "blogPost": posts.map(post => ({
      "@type": "BlogPosting",
      "headline": post.title[currentLang],
      "datePublished": post.date,
      "url": `https://sudokugame24.com/${locale}/blog/${post.slug}`
    }))
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-white/10 bg-[#0A101C]">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-gold/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-orange/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-20 relative z-10">
          <div className="flex items-center gap-3 mb-4 text-brand-gold">
            <BookOpen className="w-8 h-8" />
            <span className="font-black tracking-[0.2em] uppercase text-sm">SudokuGame24</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-white">
            {tTitle}
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl font-medium leading-relaxed">
            {tSubtitle}
          </p>
        </div>
      </div>

      {/* Blog List */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, idx) => (
            <Link key={idx} href={`/${locale}/blog/${post.slug}`}>
              <div className="group h-full bg-[#0E1525] border border-white/10 hover:border-brand-gold/50 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-2 shadow-xl hover:shadow-[0_20px_40px_rgba(255,204,0,0.1)] flex flex-col cursor-pointer">
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-white/5 rounded-lg text-brand-gold">
                    {post.category}
                  </span>
                  <BookOpen className="w-5 h-5 text-gray-500 group-hover:text-brand-gold transition-colors" />
                </div>
                <h2 className="text-2xl font-black mb-4 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-brand-gold group-hover:to-brand-orange transition-all line-clamp-2">
                  {post.title[currentLang]}
                </h2>
                
                <p className="text-gray-400 text-sm leading-relaxed mb-8 line-clamp-3 flex-1">
                  {post.description[currentLang]}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/10">
                  <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" /> {new Date(post.date).toLocaleDateString(locale)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> {post.readTime}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-gold group-hover:text-black transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
