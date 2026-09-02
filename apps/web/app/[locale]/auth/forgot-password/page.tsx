"use client";
import { API_URL } from "@/lib/api";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      // We don't expose if the email exists for security
      setStatus("success");
      setMessage("Si cette adresse email existe, un lien de réinitialisation vous a été envoyé.");
    } catch (err) {
      setStatus("error");
      setMessage("Erreur de connexion au serveur.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-brand-navy/80 border border-white/15 backdrop-blur-2xl rounded-3xl p-8">
        <h1 className="text-2xl font-black text-white mb-2 text-center">Mot de passe oublié</h1>
        <p className="text-slate-400 text-sm text-center mb-6">
          Entrez votre adresse email pour recevoir un lien de réinitialisation.
        </p>
        
        {status === "success" ? (
          <div className="text-center">
            <p className="text-brand-orange font-bold">{message}</p>
            <button
              onClick={() => router.push("/auth")}
              className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"
            >
              Retour à la connexion
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === "error" && (
              <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl font-medium">
                {message}
              </div>
            )}
            
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="email"
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#0c1b33] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-orange text-sm font-medium"
              />
            </div>

            <button
              disabled={status === "loading"}
              className="w-full py-3.5 mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-brand-orange to-[#FF6B33] text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg disabled:opacity-50"
            >
              {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
              Envoyer le lien
            </button>
            
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => router.push("/auth")}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
