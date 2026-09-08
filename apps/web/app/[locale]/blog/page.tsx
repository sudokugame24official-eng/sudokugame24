"use client";

import React from "react";
import { Link } from "@/navigation";
import { BookOpen, Construction, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

export default function BlogPage() {
  const t = useTranslations("common");

  return (
    <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-brand-navy-light border border-white/10 rounded-3xl p-10 text-center shadow-2xl">
        <div className="w-20 h-20 bg-brand-orange/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-10 h-10 text-brand-orange" />
        </div>
        
        <h1 className="text-3xl font-black text-white mb-4 uppercase tracking-wider">
          Blog & Actus
        </h1>
        
        <p className="text-gray-400 mb-8 leading-relaxed">
          Notre espace blog est actuellement en cours de construction. Revenez très bientôt pour découvrir nos derniers articles, actualités et astuces sur le Sudoku !
        </p>

        <div className="flex items-center justify-center gap-2 text-brand-gold mb-8 font-bold">
          <Construction className="w-5 h-5 animate-pulse" />
          <span>Bientôt disponible</span>
        </div>

        <Link href="/">
          <button className="w-full flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </button>
        </Link>
      </div>
    </div>
  );
}
