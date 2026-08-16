"use client";
import { WS_URL } from "@/lib/api";
import React, { useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";
import {
  Sword,
  Users,
  Loader2,
  UserPlus,
  KeyRound,
  Globe,
  Circle,
  Sparkles,
  Zap,
  Lock,
  X,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { SudokuBoard } from "@/components/SudokuGrid";
import { cn } from "@/lib/utils";

const IS_LOGGED_IN = false;

// Card Component with 3D Mouse Tracking Glow Effect
function PremiumCard({
  title,
  description,
  icon: Icon,
  onClick,
  colorFrom,
  colorTo,
  delay,
}: {
  title: string;
  description: string;
  icon: any;
  onClick: () => void;
  colorFrom: string;
  colorTo: string;
  delay: number;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, type: "spring", stiffness: 100 }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      whileHover={{ scale: 1.05, y: -10 }}
      whileTap={{ scale: 0.95 }}
      className="group relative flex flex-col items-center justify-center p-8 bg-card/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] cursor-pointer overflow-hidden shadow-2xl z-10"
    >
      {/* Dynamic Cursor Glow */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[2.5rem] opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              350px circle at ${mouseX}px ${mouseY}px,
              ${colorFrom}20,
              transparent 80%
            )
          `,
        }}
      />
      {/* Animated Border gradient on hover */}
      <div
        className={cn(
          "absolute inset-0 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br -z-10",
          `from-${colorFrom}/20 to-${colorTo}/20`,
        )}
      />

      <motion.div
        initial={{ rotate: 0 }}
        whileHover={{ rotate: 15, scale: 1.2 }}
        transition={{ type: "spring", stiffness: 300, damping: 10 }}
        className={cn(
          "w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-lg bg-gradient-to-br",
          `from-${colorFrom}/20 to-${colorTo}/20 border border-${colorFrom}/30`,
        )}
      >
        <Icon
          className={cn(`w-10 h-10 text-${colorFrom}`)}
          style={{ color: colorFrom }}
        />
      </motion.div>

      <h3 className="text-2xl font-black mb-3 tracking-tight text-white">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground text-center leading-relaxed">
        {description}
      </p>

      {/* Decorative particles */}
      <Sparkles className="absolute top-4 right-4 w-4 h-4 text-white/10 group-hover:text-white/40 transition-colors" />
      <Zap className="absolute bottom-4 left-4 w-4 h-4 text-white/10 group-hover:text-white/40 transition-colors" />
    </motion.div>
  );
}

export default function MultiplayerPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<
    "idle" | "searching" | "playing" | "room"
  >("idle");
  const [matchData, setMatchData] = useState<any>(null);

  useEffect(() => {
    const newSocket = io(WS_URL);
    setSocket(newSocket);
    newSocket.on("waitingForOpponent", () => setStatus("searching"));
    newSocket.on("gameStarted", (data) => {
      setMatchData(data);
      setStatus("playing");
    });
    return () => {
      newSocket.close();
    };
  }, []);

  const startMatchmaking = () => {
    if (socket) {
      socket.emit("joinMatchmaking");
      setStatus("searching");
    }
  };

  // ... (keeping the 'playing' UI logic simplified for now)
  if (status === "playing")
    return (
      <div className="min-h-screen">
        <SudokuBoard difficulty={matchData?.difficulty || "MEDIUM"} />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#050505] text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animated Orbs for AAA Feel */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, 90, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full blur-[150px] mix-blend-screen pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2],
          rotate: [0, -90, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-purple-600/20 rounded-full blur-[150px] mix-blend-screen pointer-events-none"
      />

      <div className="text-center mb-16 relative z-10 w-full max-w-4xl">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
            Serveurs en ligne - 45,123 Joueurs
          </span>
        </motion.div>

        <motion.h1
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black mb-6 tracking-tighter"
        >
          L'ARÈNE{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-purple-500">
            MONDIALE
          </span>
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium"
        >
          Choisissez votre mode de combat. Grimpez dans le classement Elo ou
          humiliez vos amis en temps réel.
        </motion.p>
      </div>

      <AnimatePresence mode="wait">
        {status === "idle" ? (
          <motion.div
            key="choices"
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl w-full z-10 px-4"
          >
            <PremiumCard
              title="Classé Aléatoire"
              description="Trouvez instantanément un adversaire de votre niveau. Gagnez de l'Elo et atteignez le rang Master."
              icon={Globe}
              onClick={startMatchmaking}
              colorFrom="#3b82f6" // blue-500
              colorTo="#2563eb"
              delay={0.3}
            />
            <PremiumCard
              title="Défier un Ami"
              description="Invitez un joueur de votre liste d'amis. Les statistiques sont enregistrées pour la vantardise."
              icon={UserPlus}
              onClick={() => setStatus("room")}
              colorFrom="#a855f7" // purple-500
              colorTo="#7e22ce"
              delay={0.4}
            />
            <PremiumCard
              title="Salle Personnalisée"
              description="Créez une arène privée avec un code secret pour organiser vos propres tournois."
              icon={KeyRound}
              onClick={() => setStatus("room")}
              colorFrom="#eab308" // yellow-500
              colorTo="#ca8a04"
              delay={0.5}
            />
          </motion.div>
        ) : status === "searching" ? (
          <motion.div
            key="searching"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent rounded-[3rem] blur-xl animate-pulse" />
            <div className="bg-card/40 backdrop-blur-3xl border border-white/10 p-12 rounded-[3rem] flex flex-col items-center text-center shadow-2xl relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 rounded-full border-b-2 border-l-2 border-primary mb-8"
              />
              <Loader2 className="w-8 h-8 text-primary animate-spin absolute top-[3.75rem]" />
              <h2 className="text-3xl font-black mb-2 tracking-tight">
                Recherche en cours
              </h2>
              <p className="text-muted-foreground mb-8">
                Analyse de l'Elo des joueurs mondiaux...
              </p>

              <button
                onClick={() => setStatus("idle")}
                className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-full font-bold transition-colors border border-white/10 uppercase tracking-widest text-xs"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        ) : status === "room" ? (
          <motion.div
            key="room"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="z-10 w-full max-w-md bg-card/60 backdrop-blur-3xl border border-white/10 p-8 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black">Accès Restreint</h2>
              <button
                onClick={() => setStatus("idle")}
                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center py-8">
              <div className="w-24 h-24 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-full mx-auto flex items-center justify-center mb-6 border border-purple-500/30">
                <Lock className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">
                Connexion au réseau
              </h3>
              <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                Le système d'invitation et de salles personnalisées requiert une
                identité vérifiée sur nos serveurs.
              </p>
              <button className="w-full relative group overflow-hidden bg-primary text-primary-foreground font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-transform hover:scale-[1.02]">
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                S'authentifier maintenant
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
