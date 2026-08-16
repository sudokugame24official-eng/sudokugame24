import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Calendar, User, Clock } from 'lucide-react';

async function getArticle(slug: string, locale: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/content/articles/${slug}?locale=${locale}`,
    { next: { revalidate: 60 } } // Revalidate every minute
  );
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string; locale: string };
}): Promise<Metadata> {
  const article = await getArticle(params.slug, params.locale);
  if (!article) return { title: 'Article Not Found' };

  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt,
    openGraph: {
      title: article.metaTitle || article.title,
      description: article.metaDescription || article.excerpt,
      images: article.openGraphImage ? [article.openGraphImage] : [],
    },
    alternates: {
      canonical: article.canonicalUrl,
    },
    robots: {
      index: !article.noIndex,
      follow: !article.noIndex,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  const article = await getArticle(params.slug, params.locale);

  if (!article) {
    notFound();
  }

  // Calculate estimated reading time
  const words = article.content.split(/\s+/).length;
  const readingTime = Math.ceil(words / 200);

  return (
    <article className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-12 text-center space-y-6">
        {article.category && (
          <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
            {article.category}
          </span>
        )}
        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
          {article.title}
        </h1>
        
        {article.excerpt && (
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {article.excerpt}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground mt-8">
          <div className="flex items-center gap-2">
            {article.author?.profile?.avatarUrl ? (
              <img 
                src={article.author.profile.avatarUrl} 
                alt={article.author.profile.username}
                className="w-8 h-8 rounded-full border border-white/10"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-primary">
                {article.author?.profile?.username?.substring(0, 2).toUpperCase() || 'SP'}
              </div>
            )}
            <span className="font-bold">{article.author?.profile?.username || 'Redaction'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <time dateTime={article.createdAt}>
              {new Date(article.createdAt).toLocaleDateString(params.locale === 'fr' ? 'fr-FR' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{readingTime} min read</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {/* In a real app, use a markdown renderer or safe HTML injection (dangerouslySetInnerHTML) */}
      <div 
        className="prose prose-invert prose-lg max-w-none prose-headings:font-black prose-a:text-primary hover:prose-a:text-primary/80"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </article>
  );
}
