import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Share2 } from "lucide-react";

import { BLOG_ARTICLES, BlogPost } from "@/lib/blog-data";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const currentLang = (["en", "fr", "de"].includes(locale) ? locale : "en") as "en" | "fr" | "de";
  const post = BLOG_ARTICLES.find(a => a.slug === slug);

  if (!post) {
    return { title: "Not Found" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sudokugame24.com";
  
  return {
    title: `${post.title[currentLang]} | Sudoku Blog`,
    description: post.description[currentLang],
    alternates: {
      canonical: `${siteUrl}/${locale}/blog/${slug}`,
    },
    openGraph: {
      title: post.title[currentLang],
      description: post.description[currentLang],
      type: "article",
      url: `${siteUrl}/${locale}/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const currentLang = (["en", "fr", "de"].includes(locale) ? locale : "en") as "en" | "fr" | "de";
  const post = BLOG_ARTICLES.find(a => a.slug === slug);

  if (!post) {
    notFound();
  }

  const tBack = currentLang === "fr" ? "Retour au blog" : currentLang === "de" ? "Zurück zum Blog" : "Back to blog";
  const tShare = currentLang === "fr" ? "Partager cet article" : currentLang === "de" ? "Diesen Artikel teilen" : "Share this article";

  // Blog content is trusted HTML from lib/blog-data.ts

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title[currentLang],
    "description": post.description[currentLang],
    "datePublished": post.date,
    "author": {
      "@type": "Organization",
      "name": "SudokuGame24"
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      {/* Header Spacer */}
      <div className="h-[72px]" />
      
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link 
          href={`/${locale}/blog`}
          className="inline-flex items-center gap-2 text-brand-gold hover:text-brand-orange font-bold text-sm tracking-wider uppercase mb-12 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {tBack}
        </Link>
        
        <div className="mb-8">
          <span className="px-3 py-1 text-xs font-black uppercase tracking-wider bg-brand-gold/10 border border-brand-gold/20 rounded-lg text-brand-gold mb-6 inline-block">
            {post.category}
          </span>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight text-white leading-[1.1]">
            {post.title[currentLang]}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-gray-500 pb-8 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> {new Date(post.date).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> {post.readTime}
            </div>
          </div>
        </div>
        
        <article 
          className="prose prose-invert prose-lg max-w-none prose-headings:font-black prose-p:text-gray-300 prose-a:text-brand-gold hover:prose-a:text-brand-orange prose-ul:text-gray-300 prose-li:text-gray-300"
          dangerouslySetInnerHTML={{ __html: post.content[currentLang] || post.content["en"] || "" }}
        />
        
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <span className="font-bold uppercase tracking-wider text-sm text-gray-400">
            {tShare}
          </span>
          <div className="flex items-center gap-3">

            <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors" onClick={() => navigator.clipboard.writeText(window.location.href)}>
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
