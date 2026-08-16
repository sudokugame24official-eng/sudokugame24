import React from 'react';
import Link from 'next/link';
import { BookOpen, Brain, Zap, Target, ArrowRight } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sudoku Knowledge Hub - Learn Advanced Techniques',
  description: 'Master Sudoku with our interactive tutorials. Learn X-Wing, Swordfish, and more expert techniques.',
};

async function getTechniques() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/knowledge/techniques`, {
      next: { revalidate: 60 } // Cache for 1 minute
    });
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    return [];
  }
}

export default async function KnowledgeHubPage({ params }: { params: { locale: string } }) {
  const techniques = await getTechniques();
  
  const categories = [
    { title: 'Beginner', difficulty: 'EASY', icon: BookOpen, color: 'text-green-500', bg: 'bg-green-500/10' },
    { title: 'Intermediate', difficulty: 'MEDIUM', icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Advanced', difficulty: 'HARD', icon: Brain, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: 'Expert', difficulty: 'EXPERT', icon: Zap, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  return (
    <div className="min-h-screen bg-[#020F24] text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-black mb-6 tracking-tight">
            Sudoku <span className="text-primary">Knowledge Hub</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            From basic rules to grandmaster strategies, master the grid with our interactive tutorials.
          </p>
        </div>

        <div className="space-y-16">
          {categories.map((category) => {
            const catTechniques = techniques.filter((t: any) => t.difficulty === category.difficulty);
            
            if (catTechniques.length === 0) return null;

            return (
              <section key={category.title}>
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${category.bg}`}>
                    <category.icon className={`w-6 h-6 ${category.color}`} />
                  </div>
                  <h2 className="text-3xl font-bold">{category.title} Techniques</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {catTechniques.map((tech: any) => (
                    <Link 
                      key={tech.slug} 
                      href={`/${params.locale}/knowledge/${tech.slug}`}
                      className="group bg-card/40 border border-white/10 rounded-2xl p-6 hover:bg-white/5 transition-all hover:border-primary/50"
                    >
                      <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                        {tech.title}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-6">
                        {tech.description}
                      </p>
                      <div className="flex items-center text-primary font-bold text-sm group-hover:translate-x-2 transition-transform">
                        Interactive Tutorial <ArrowRight className="w-4 h-4 ml-2" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
