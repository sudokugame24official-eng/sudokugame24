import React from "react";
import { Metadata } from "next";
import { ShieldCheck, HeartHandshake, Zap, Ban, Users, MessageSquare } from "lucide-react";
import { Link } from "@/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Règles Communautaires & Fair-Play | Sudoku Premium",
    description:
      "Consultez la charte de fair-play, les règles de respect mutuel et les politiques anti-triche de la plateforme mondiale Sudoku.",
    alternates: {
      canonical: `/${locale}/guidelines`,
    },
  };
}

export default async function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-[#041226] text-white py-16 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-brand-gold/15 border border-brand-gold/30 text-brand-gold px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            <span>Charte Officielle de la Communauté</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight">
            Règles Communautaires & Fair-Play
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Sudoku Premium est un sanctuaire d'émulation logique, de respect mutuel et d'esprits vifs. Voici les principes que chaque joueur s'engage à respecter.
          </p>
        </div>

        {/* 4 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-brand-navy-light/80 border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-cyan/20 flex items-center justify-center text-brand-cyan">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-wide">1. Respect & Esprit Sportif</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Dans le chat global, les forums et les duels 1v1, les insultes, propos haineux, harcèlement ou provocations toxiques sont strictement interdits. Félicitez vos adversaires et partagez vos connaissances avec bienveillance.
            </p>
          </div>

          <div className="bg-brand-navy-light/80 border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-orange/20 flex items-center justify-center text-brand-orange">
              <Ban className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-wide">2. Tolérance Zéro Anti-Triche</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              L'utilisation de solveurs automatisés, de scripts d'injection, de bots d'émulation ou de double-comptes pour gonfler artificiellement son classement Elo entraîne un bannissement permanent et irréversible de l'IP et du compte.
            </p>
          </div>

          <div className="bg-brand-navy-light/80 border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-wide">3. Qualité des Publications</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Sur le forum et l'espace Q&A, publiez des sujets clairs, pertinents et bien catégorisés. Le spam, les liens d'affiliation non sollicités et les messages hors-sujet répétitifs sont immédiatement supprimés par la modération.
            </p>
          </div>

          <div className="bg-brand-navy-light/80 border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
              <Zap className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-wide">4. Fair-Play en Duel</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              L'abandon délibéré en cours de partie pour éviter une perte de points est pénalisé automatiquement par une défaite par forfait et un malus d'Elo.
            </p>
          </div>
        </div>

        {/* Action Link */}
        <div className="text-center pt-8 border-t border-white/10">
          <Link href="/forum">
            <button className="px-8 py-4 bg-brand-gold text-brand-navy font-black rounded-2xl uppercase tracking-wider shadow-lg hover:brightness-110 transition-all text-sm">
              Accéder au Forum Communautaire
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
