"use client";
import { API_URL } from "@/lib/api";
import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!token) {
      setStatus("error");
      setMessage("Token invalide ou manquant.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus("success");
        setMessage("Votre mot de passe a été mis à jour avec succès.");
        setTimeout(() => router.push("/auth"), 3000);
      } else {
        setStatus("error");
        setMessage(data.message || "Erreur lors de la réinitialisation.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Erreur de connexion au serveur.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-brand-navy/80 border border-white/15 backdrop-blur-2xl rounded-3xl p-8">
        <h1 className="text-2xl font-black text-white mb-6 text-center">Réinitialiser le mot de passe</h1>
        
        {status === "success" ? (
          <div className="text-center">
            <p className="text-green-400 font-bold">{message}</p>
            <p className="text-sm text-slate-400 mt-4">Redirection vers la connexion...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === "error" && (
              <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl font-medium">
                {message}
              </div>
            )}
            
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="password"
                placeholder="Nouveau mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#0c1b33] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-orange text-sm font-medium"
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="password"
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-[#0c1b33] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-orange text-sm font-medium"
              />
            </div>

            <button
              disabled={status === "loading"}
              className="w-full py-3.5 mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-brand-orange to-[#FF6B33] text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg disabled:opacity-50"
            >
              {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
              Réinitialiser
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
