"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Loader2, Video, CheckCircle2 } from "lucide-react";
import { API_URL } from "@/lib/api";

interface RewardVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReward: () => void;
}

export default function RewardVideoModal({
  isOpen,
  onClose,
  onReward,
}: RewardVideoModalProps) {
  const [stage, setStage] = useState<"intro" | "playing" | "rewarded">("intro");
  const [timeLeft, setTimeLeft] = useState(15);

  // Reset stage when opened
  useEffect(() => {
    if (isOpen) {
      setStage("intro");
      setTimeLeft(15);
    }
  }, [isOpen]);

  // Simulate Video Ad countdown
  useEffect(() => {
    if (stage === "playing") {
      if (timeLeft > 0) {
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        handleReward();
      }
    }
  }, [stage, timeLeft]);

  const handlePlayAd = () => {
    setStage("playing");
  };

  const handleReward = async () => {
    try {
      const res = await fetch(`${API_URL}/shop/watch-ad`, {
        credentials: "include",
        method: "POST",
      });
      if (res.ok) {
        setStage("rewarded");
        onReward();
      } else {
        // Fallback or error
        setStage("intro");
        onClose();
      }
    } catch (e) {
      console.error("Failed to grant reward", e);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md bg-[#001529] border border-[#FFCC00]/30 rounded-3xl overflow-hidden relative shadow-[0_0_50px_rgba(255,204,0,0.1)]"
          >
            {/* Stage: Intro */}
            {stage === "intro" && (
              <div className="p-8 text-center flex flex-col items-center">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="w-20 h-20 bg-[#FFCC00]/20 rounded-full flex items-center justify-center mb-6">
                  <Video className="w-10 h-10 text-[#FFCC00]" />
                </div>

                <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
                  Besoin d'un Indice ?
                </h2>
                <p className="text-white/70 mb-8">
                  Regardez une courte vidéo publicitaire pour débloquer un
                  indice gratuit et débloquer votre partie.
                </p>

                <button
                  onClick={handlePlayAd}
                  className="w-full py-4 bg-gradient-to-r from-[#FFCC00] to-[#FF9900] rounded-xl font-bold text-[#001529] uppercase tracking-widest flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(255,204,0,0.5)] transition-all"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Regarder la Vidéo
                </button>
              </div>
            )}

            {/* Stage: Playing */}
            {stage === "playing" && (
              <div className="relative w-full aspect-video bg-black flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-[#FFCC00] animate-spin mb-4" />
                <p className="text-white font-medium mb-2">
                  Publicité sponsorisée (simulation)
                </p>

                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-white text-sm font-bold border border-white/20">
                  {timeLeft}s
                </div>

                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
                  <div
                    className="h-full bg-[#FFCC00] transition-all duration-1000 ease-linear"
                    style={{ width: `${((15 - timeLeft) / 15) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Stage: Rewarded */}
            {stage === "rewarded" && (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>

                <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
                  Récompense Débloquée !
                </h2>
                <p className="text-white/70 mb-8">
                  Votre indice a été crédité. Vous pouvez maintenant l'utiliser
                  sur la grille.
                </p>

                <button
                  onClick={onClose}
                  className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-white uppercase tracking-widest transition-all"
                >
                  Continuer à jouer
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
