"use client";
import React, { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { motion } from "framer-motion";
import { User, Activity, Clock, Shield, PlayCircle } from "lucide-react";
import { PlayerIdentity } from "@/components/PlayerIdentity";
import { useAuth } from "@/components/AuthProvider";
import { useRouter, Link } from "@/navigation";

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.id) {
      fetch(`${API_URL}/users/stats/${user.id}`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          setStats(data);
          setStatsLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load stats", err);
          setStatsLoading(false);
        });
    }
  }, [user]);

  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Loading profile...
      </div>
    );
  }

  if (!user) return null;
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="col-span-1">
          <div className="bg-card border border-border rounded-3xl p-8 text-center shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary/30 to-purple-500/30" />
            <div className="relative z-10">
              <div className="w-32 h-32 bg-background border-4 border-card rounded-full mx-auto flex items-center justify-center shadow-lg mb-4 mt-8">
                <User className="w-16 h-16 text-muted-foreground" />
              </div>
              <div className="flex justify-center mb-1">
                <PlayerIdentity
                  username={
                    user.profile?.username ||
                    (user.email ? user.email.split("@")[0] : "User") ||
                    "User"
                  }
                  level={stats?.level || 1}
                  size="xl"
                />
              </div>
              <p className="text-primary font-medium text-sm mb-6">
                Ligue{" "}
                {stats?.rating > 2000
                  ? "Master"
                  : stats?.rating > 1500
                    ? "Or"
                    : "Argent"}
              </p>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border text-sm">
                  <span className="text-muted-foreground">Score Elo</span>
                  <span className="font-bold font-mono text-lg">
                    {stats?.rating || 1200}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border text-sm">
                  <span className="text-muted-foreground">Parties Jouées</span>
                  <span className="font-bold font-mono">
                    {stats?.gamesPlayed || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 text-sm">
                  <span className="text-muted-foreground">Win Rate</span>
                  <span className="font-bold text-green-500">
                    {Math.round(stats?.winRate || 0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="col-span-1 md:col-span-2 space-y-8">
          <h2 className="text-3xl font-bold">Tableau de Bord</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Meilleur Temps</p>
                <p className="text-2xl font-bold font-mono">
                  {stats?.bestTimeSec
                    ? `${Math.floor(stats.bestTimeSec / 60)
                        .toString()
                        .padStart(
                          2,
                          "0",
                        )}:${(stats.bestTimeSec % 60).toString().padStart(2, "0")}`
                    : "--:--"}
                </p>
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Succès Débloqués
                </p>
                <p className="text-2xl font-bold">42 / 50</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Derniers Replays</h3>
            <div className="space-y-3">
              {/* This could also be fetched from real duel history later */}
              <div className="bg-card border border-border p-8 rounded-xl text-center text-muted-foreground">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="mb-4 text-white">
                  Vous n'avez pas encore joué de partie.
                </p>
                <Link
                  href="/play"
                  className="bg-[#FFCC00] text-[#041E42] px-6 py-2 rounded-xl font-bold uppercase hover:bg-[#e6b800] transition-colors inline-block"
                >
                  Jouer votre premier Sudoku
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
