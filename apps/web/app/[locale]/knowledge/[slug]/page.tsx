import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Brain, Target, Zap } from 'lucide-react';

async function getTechnique(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/knowledge/techniques/${slug}`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const technique = await getTechnique(params.slug);
  if (!technique) return { title: 'Technique Not Found' };
  
  return {
    title: technique.metaTitle || `${technique.title} - Sudoku Technique`,
    description: technique.metaDescription || technique.description.substring(0, 160),
    alternates: {
      canonical: technique.canonicalUrl || `https://sudoku-premium.com/en/knowledge/${technique.slug}`,
    }
  };
}

export default async function TechniquePage({ params }: { params: { locale: string, slug: string } }) {
  const technique = await getTechnique(params.slug);
  if (!technique) notFound();

  const getDifficultyIcon = (diff: string) => {
    switch(diff) {
      case 'EASY': return <BookOpen className="w-5 h-5 text-green-500" />;
      case 'MEDIUM': return <Target className="w-5 h-5 text-blue-500" />;
      case 'HARD': return <Brain className="w-5 h-5 text-purple-500" />;
      case 'EXPERT': return <Zap className="w-5 h-5 text-red-500" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#020F24] text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link href={`/${params.locale}/knowledge`} className="inline-flex items-center text-muted-foreground hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour au Knowledge Hub
        </Link>
        
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 font-bold text-sm">
              {getDifficultyIcon(technique.difficulty)}
              {technique.difficulty}
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6">{technique.title}</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {technique.description}
          </p>
        </header>

        {/* INTERACTIVE COMPONENT WILL GO HERE */}
        <div className="bg-card/40 border border-white/10 rounded-2xl p-8 mb-12 backdrop-blur-2xl">
          <h2 className="text-2xl font-bold mb-6">Interactive Coach</h2>
          
          <div className="aspect-square max-w-md mx-auto bg-white/5 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center p-6">
            <Brain className="w-16 h-16 text-primary/50 mb-4" />
            <h3 className="font-bold text-lg mb-2">Simulateur en construction</h3>
            <p className="text-sm text-muted-foreground">
              Le lecteur interactif pour la technique "{technique.title}" est en cours de développement.
              Il vous permettra de voir cette technique en action étape par étape.
            </p>
          </div>
        </div>
        
        {/* FALLBACK CONTENT */}
        <div className="prose prose-invert prose-lg max-w-none">
          <h3>Comment repérer cette technique ?</h3>
          <p>
            Cette technique s'applique généralement lorsque vous êtes bloqué avec les méthodes classiques (Cross-hatching, Full House). 
            Il faut rechercher des motifs spécifiques dans les candidats.
          </p>
          
          {technique.videoUrl && (
            <div className="mt-8 aspect-video w-full rounded-xl overflow-hidden border border-white/10">
              <iframe 
                src={technique.videoUrl} 
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
