"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { WS_URL } from "@/lib/api";
import { io, Socket } from "socket.io-client";
import { Swords, Check, X, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DuelChallenge {
  challengeId: string;
  challengerId: string;
  challengerUsername: string;
  difficulty: string;
  betAmount: number;
  expiresIn: number;
}

export function DuelChallengeListener() {
  const { user } = useAuth();
  const router = useRouter();
  const [challenge, setChallenge] = useState<DuelChallenge | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (!user) return;

    const presenceSocket = io(`${WS_URL}/presence`, { withCredentials: true });

    presenceSocket.on("connect", () => {
      presenceSocket.emit("identify");
    });

    presenceSocket.on("duel_challenge_received", (data: DuelChallenge) => {
      setChallenge(data);
      setTimeLeft(data.expiresIn || 60);
      toast.info(`Défi de Duel reçu de ${data.challengerUsername} !`, {
        description: `Difficulté: ${data.difficulty} | Mise: ${data.betAmount} pièces`,
        duration: 10000,
      });
    });

    presenceSocket.on("challenge_started", (data: { matchId: string }) => {
      setChallenge(null);
      toast.success("Défi accepté ! Lancement de la partie...");
      router.push(`/duel/${data.matchId}`);
    });

    presenceSocket.on("challenge_declined", () => {
      setChallenge(null);
      toast.info("Le défi a été refusé.");
    });

    presenceSocket.on("challenge_error", (data: { reason: string }) => {
      setChallenge(null);
      toast.error(`Erreur défi: ${data.reason}`);
    });

    setSocket(presenceSocket);

    return () => {
      presenceSocket.disconnect();
    };
  }, [user, router]);

  useEffect(() => {
    if (!challenge) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setChallenge(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [challenge]);

  const respond = (accept: boolean) => {
    if (!challenge || !socket) return;
    socket.emit("challenge_respond", {
      challengeId: challenge.challengeId,
      accept,
    });
    if (!accept) setChallenge(null);
  };

  if (!challenge) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-in max-w-md w-full p-1">
      <div className="bg-[#0A2A5C] border-2 border-brand-gold rounded-3xl p-5 shadow-2xl backdrop-blur-xl text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-orange/20 border border-brand-orange/40 flex items-center justify-center">
            <Swords className="w-5 h-5 text-brand-orange" />
          </div>
          <div>
            <h4 className="font-black text-sm uppercase tracking-wide text-brand-gold">
              Défi de Duel 1v1 !
            </h4>
            <p className="text-xs text-gray-300">
              <strong className="text-white">{challenge.challengerUsername}</strong> vous invite à un match.
            </p>
          </div>
        </div>

        <div className="bg-black/30 rounded-2xl p-3 mb-4 flex justify-between items-center text-xs">
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Difficulté</span>
            <span className="font-black text-brand-cyan">{challenge.difficulty}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Mise</span>
            <span className="font-black text-brand-gold">{challenge.betAmount} Pièces</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Expire dans</span>
            <span className="font-black text-red-400">{timeLeft}s</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => respond(false)}
            className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
          >
            <X className="w-3.5 h-3.5" /> Refuser
          </button>
          <button
            onClick={() => respond(true)}
            className="flex-1 py-2.5 bg-gradient-to-r from-brand-orange to-brand-gold hover:brightness-110 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg transition-all"
          >
            <Check className="w-3.5 h-3.5" /> Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
