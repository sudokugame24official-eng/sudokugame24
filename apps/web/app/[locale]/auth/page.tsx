"use client";
import { API_URL } from "@/lib/api";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, Globe, Smartphone, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin
        ? { email, password }
        : { email, password, username };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Une erreur est survenue");
      }

      const userData = await res.json();
      login(userData);
      router.push("/profile");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] mix-blend-screen opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen opacity-50" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400 mb-2">
            {isLogin ? "Rebonjour !" : "Rejoignez la légende"}
          </h1>
          <p className="text-muted-foreground">
            {isLogin
              ? "Connectez-vous pour reprendre votre progression et grimper dans le classement."
              : "Créez un compte pour jouer en multijoueur et suivre vos statistiques."}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-xl">
              {error}
            </div>
          )}

          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={!isLogin}
                className="w-full bg-secondary/50 border border-border rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <input
              type="email"
              placeholder="Adresse e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-secondary/50 border border-border rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-secondary/50 border border-border rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <button
            disabled={loading}
            className="w-full py-3 mt-4 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLogin ? "Se connecter" : "S'inscrire"}
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4 before:flex-1 before:border-t before:border-border after:flex-1 after:border-t after:border-border">
          <span className="text-muted-foreground text-sm font-medium">OU</span>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <button
            onClick={handleGoogleAuth}
            className="flex items-center justify-center gap-2 w-full py-3 border border-border rounded-xl bg-secondary/30 hover:bg-secondary/80 transition-colors"
          >
            <Globe className="w-5 h-5 text-red-500" />
            <span className="font-semibold text-sm">
              Se connecter avec Google
            </span>
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          {isLogin ? "Pas encore de compte ? " : "Déjà membre ? "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-primary font-bold hover:underline"
          >
            {isLogin ? "S'inscrire" : "Se connecter"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
