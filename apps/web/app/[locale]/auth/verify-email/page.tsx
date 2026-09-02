"use client";
import { API_URL } from "@/lib/api";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token manquant.");
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        
        const data = await res.json();
        
        if (res.ok) {
          setStatus("success");
          setMessage("Votre email a été vérifié avec succès !");
          setTimeout(() => router.push("/auth"), 3000);
        } else {
          setStatus("error");
          setMessage(data.message || "Le lien est invalide ou a expiré.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Erreur de connexion au serveur.");
      }
    };

    verifyToken();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-brand-navy/80 border border-white/15 backdrop-blur-2xl rounded-3xl p-8 text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-brand-orange animate-spin" />
            <h2 className="text-xl font-bold text-white">Vérification en cours...</h2>
          </div>
        )}
        
        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <h2 className="text-xl font-bold text-white">Succès !</h2>
            <p className="text-slate-300">{message}</p>
            <p className="text-sm text-slate-400 mt-4">Redirection vers la connexion...</p>
          </div>
        )}
        
        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="w-12 h-12 text-red-500" />
            <h2 className="text-xl font-bold text-white">Erreur</h2>
            <p className="text-slate-300">{message}</p>
            <button
              onClick={() => router.push("/auth")}
              className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"
            >
              Retour à l'accueil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
