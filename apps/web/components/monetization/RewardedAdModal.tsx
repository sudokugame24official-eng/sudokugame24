"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Play, X, CheckCircle2, AlertCircle, Sparkles, Clock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

interface RewardedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardGranted?: (coins: number) => void;
}

export function RewardedAdModal({
  isOpen,
  onClose,
  onRewardGranted,
}: RewardedAdModalProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [watching, setWatching] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchStatus();
      setRewardClaimed(false);
      setWatching(false);
      setCountdown(5);
    }
  }, [isOpen, user]);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/rewarded-ads/status`, {
        credentials: "include",
      });
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartAd = async () => {
    if (!user) {
      toast.error("Connectez-vous pour recevoir des récompenses.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/rewarded-ads/initiate`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message || "Impossible de lancer la vidéo sponsorisée.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setSessionData(data);
      setWatching(true);
      setCountdown(5); // Simulated 5 seconds test completion
    } catch {
      toast.error("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  // Simulated countdown for video ad playback
  useEffect(() => {
    if (!watching || countdown <= 0) return;
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [watching, countdown]);

  // Claim reward once countdown reaches 0
  useEffect(() => {
    if (watching && countdown === 0 && sessionData?.rewardToken && !rewardClaimed) {
      claimReward();
    }
  }, [watching, countdown, sessionData, rewardClaimed]);

  const claimReward = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/rewarded-ads/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          rewardToken: sessionData.rewardToken,
          idempotencyKey: `claim_${sessionData.sessionId}`,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setRewardClaimed(true);
        toast.success(`+${result.rewardAmount} Pièces reçues avec succès ! 🎉`);
        if (onRewardGranted) onRewardGranted(result.rewardAmount);
        fetchStatus();
      } else {
        const err = await res.json();
        toast.error(err.message || "Échec de validation de la récompense.");
      }
    } catch {
      toast.error("Erreur lors de la réclamation.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-gradient-to-b from-[#0A2A5C] to-[#041E42] border-2 border-brand-gold/60 p-6 md:p-8 rounded-[2rem] max-w-md w-full space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden text-white"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          {!watching && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Header */}
          <div className="text-center space-y-2 relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-gold to-brand-orange rounded-3xl mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(255,204,0,0.4)] border-2 border-white/20">
              <Coins className="w-8 h-8 text-brand-navy" />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-white">
              {rewardClaimed
                ? "RÉCOMPENSE VALIDÉE !"
                : watching
                  ? "VIDÉO EN COURS..."
                  : "VIDÉO SPONSORISÉE"}
            </h3>
            <p className="text-xs text-gray-300 max-w-xs mx-auto">
              {rewardClaimed
                ? "Vos pièces ont été créditées sur votre compte avec succès."
                : watching
                  ? "Veuillez patienter jusqu'à la fin de la vidéo pour recevoir vos pièces."
                  : "Regardez une courte vidéo sponsorisée facultative pour gagner des pièces gratuitement."}
            </p>
          </div>

          {/* Body Content */}
          <div className="relative z-10">
            {watching ? (
              <div className="bg-black/60 border border-white/10 rounded-2xl p-6 text-center space-y-4">
                {countdown > 0 ? (
                  <>
                    <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-4 border-white/10 animate-spin border-t-brand-gold" />
                      <span className="text-2xl font-black text-brand-gold">{countdown}s</span>
                    </div>
                    <p className="text-xs text-gray-400">Ne fermez pas cette fenêtre.</p>
                  </>
                ) : (
                  <div className="space-y-2 py-4">
                    <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto animate-bounce" />
                    <p className="font-bold text-sm text-green-300">Vidéo terminée ! Crédit en cours...</p>
                  </div>
                )}
              </div>
            ) : rewardClaimed ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 text-center space-y-2">
                <p className="text-3xl font-black text-brand-gold flex items-center justify-center gap-2">
                  +{status?.rewardAmount || 20} <Coins className="w-7 h-7" />
                </p>
                <p className="text-xs text-green-300">
                  Transactions enregistrées sur le registre officiel.
                </p>
              </div>
            ) : (
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Gain par vidéo :</span>
                  <span className="font-black text-brand-gold flex items-center gap-1">
                    +{status?.rewardAmount || 20} Pièces
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Limite quotidienne :</span>
                  <span className="font-bold text-white">
                    {status?.todayCount || 0} / {status?.dailyCap || 5} utilisées
                  </span>
                </div>
                {status?.cooldownRemainingSeconds > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Délai d'attente : {status.cooldownRemainingSeconds}s</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="relative z-10 pt-2">
            {rewardClaimed ? (
              <button
                onClick={onClose}
                className="w-full py-3.5 bg-brand-gold text-brand-navy font-black rounded-xl uppercase tracking-wider text-xs shadow-lg hover:brightness-110 transition-all cursor-pointer"
              >
                Super, Continuer
              </button>
            ) : watching ? (
              <button
                disabled
                className="w-full py-3.5 bg-white/10 text-gray-400 font-bold rounded-xl uppercase tracking-wider text-xs cursor-not-allowed"
              >
                Lecture en cours ({countdown}s)...
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onClose}
                  className="py-3.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl uppercase tracking-wider text-xs transition-all cursor-pointer"
                >
                  Pas maintenant
                </button>
                <button
                  onClick={handleStartAd}
                  disabled={loading || !status?.eligible}
                  className="py-3.5 bg-gradient-to-r from-brand-gold to-brand-orange text-brand-navy font-black rounded-xl uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 shadow-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" /> {loading ? "Chargement..." : "Regarder"}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
