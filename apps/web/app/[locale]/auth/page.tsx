"use client";
import { API_URL } from "@/lib/api";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, Globe, Smartphone, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function AuthPage() {
  const t = useTranslations("auth");
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale || "en";

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
      throw new Error(data.message || t("errorGeneric"));
      }

      const userData = await res.json();
      login(userData);
      if (userData.role === "SUPER_ADMIN" || userData.role === "ADMIN") {
        router.push(`/${locale}/admin`);
      } else {
        router.push(`/${locale}/profile`);
      }
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
        className="w-full max-w-md bg-brand-navy/80 border border-white/15 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">
            {isLogin ? t("welcomeBack") : t("welcomeNew")}
          </h1>
          <p className="text-slate-300 text-sm">
            {isLogin
              ? t("loginSubtitle")
              : t("registerSubtitle")}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3.5 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl font-medium">
              {error}
            </div>
          )}

          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder={t("username")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={!isLogin}
                className="w-full bg-[#0c1b33] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-all text-sm font-medium"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
            <input
              type="email"
              placeholder={t("email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#0c1b33] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange transition-all text-sm font-medium"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
            <input
              type="password"
              placeholder={t("password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end mt-1">
            {isLogin && (
              <button
                type="button"
                onClick={() => router.push(`/${locale}/auth/forgot-password`)}
                className="text-xs text-slate-400 hover:text-brand-orange transition-colors"
              >
                {t("forgotPassword") || "Mot de passe oublié ?"}
              </button>
            )}
          </div>

          <button
            disabled={loading}
            className="w-full py-3.5 mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-brand-orange to-[#FF6B33] text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-[0_4px_20px_rgba(255,69,0,0.4)] hover:shadow-[0_6px_25px_rgba(255,69,0,0.6)] active:translate-y-0.5 transition-all disabled:opacity-50 btn-tactile"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLogin ? t("signIn") : t("signUp")}
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4 before:flex-1 before:border-t before:border-white/10 after:flex-1 after:border-t after:border-white/10">
          <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">{t("or")}</span>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <button
            onClick={handleGoogleAuth}
            className="flex items-center justify-center gap-3 w-full py-3 border border-white/15 rounded-xl bg-white/5 hover:bg-white/10 active:scale-98 transition-all text-slate-200 text-sm font-bold shadow-sm"
          >
            <Globe className="w-4 h-4 text-red-400" />
            <span>{t("google")}</span>
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-slate-400">
          {isLogin ? t("noAccount") + " " : t("hasAccount") + " "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-brand-orange font-black hover:underline ml-1"
          >
            {isLogin ? t("signUp") : t("signIn")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
