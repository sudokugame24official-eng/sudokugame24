"use client";
import { API_URL } from "@/lib/api";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "@/navigation";
import { useSearchParams } from "next/navigation";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [verifyState, setVerifyState] = useState<"pending" | "ok" | "error">("pending");

  useEffect(() => {
    if (!sessionId) return;
    // P1-H: the browser NEVER declares a payment successful and never forges
    // webhooks. We only ask the server to verify the session with Stripe;
    // coins are credited exclusively from Stripe's own answer (server-side).
    fetch(
      `${API_URL}/shop/purchase/status?sessionId=${encodeURIComponent(sessionId)}`,
      { credentials: "include" },
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        setVerifyState(data.status === "COMPLETED" ? "ok" : "error");
      })
      .catch(() => setVerifyState("error"));
  }, [sessionId]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Confetti / Coins animation effect placeholder */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-4 bg-yellow-400 rounded-full"
            initial={{
              top: "-10%",
              left: `${Math.random() * 100}%`,
              opacity: 1,
            }}
            animate={{
              top: "110%",
              rotate: Math.random() * 360,
            }}
            transition={{
              duration: Math.random() * 2 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card/80 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl text-center max-w-md w-full relative z-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-12 h-12 text-green-500" />
        </motion.div>

        <h1 className="text-3xl font-black mb-2">
          {verifyState === "ok" ? "Paiement Réussi !" : "Vérification du paiement..."}
        </h1>
        <p className="text-muted-foreground mb-8">
          {verifyState === "ok"
            ? "Vos pièces ont été ajoutées à votre compte avec succès. Merci pour votre soutien !"
            : verifyState === "error"
              ? "La vérification du paiement est en cours ou a échoué. Vos pièces seront créditées automatiquement dès confirmation par Stripe."
              : "Nous confirmons votre paiement auprès de Stripe..."}
        </p>

        <Link href="/shop">
          <button className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25">
            Retour à la boutique <ArrowRight className="w-5 h-5" />
          </button>
        </Link>
      </motion.div>
    </main>
  );
}
