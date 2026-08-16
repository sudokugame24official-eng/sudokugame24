"use client";
import { API_URL } from "@/lib/api";
import React, { useEffect, useState } from "react";
import {
  Users,
  Sword,
  DollarSign,
  Activity,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboard() {
  const [overview, setOverview] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [period, setPeriod] = useState("7d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [overviewRes, chartRes] = await Promise.all([
          fetch(`${API_URL}/admin/analytics/overview`, {
            credentials: "include",
          }),
          fetch(`${API_URL}/admin/analytics/chart?period=${period}`, {
            credentials: "include",
          }),
        ]);

        if (overviewRes.ok) setOverview(await overviewRes.json());
        if (chartRes.ok) setChartData(await chartRes.json());
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();

    // Simulate real-time updates every 30s
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [period]);

  const liveStats = overview
    ? [
        {
          label: "Utilisateurs en ligne",
          value: overview.onlineUsers,
          icon: Activity,
          color: "text-emerald-500",
        },
        {
          label: "Jeux Actifs",
          value: overview.activeGames,
          icon: Sword,
          color: "text-purple-500",
        },
        {
          label: "Duels Actifs",
          value: overview.activeDuels,
          icon: ShieldAlert,
          color: "text-red-500",
        },
        {
          label: "Dans le forum",
          value: overview.usersInForum,
          icon: MessageSquare,
          color: "text-blue-500",
        },
      ]
    : [];

  const kpis = overview
    ? [
        {
          label: "Nouveaux Inscrits (Auj.)",
          value: overview.newUsersToday,
          icon: Users,
          color: "text-blue-400",
        },
        {
          label: "Parties Jouées (Auj.)",
          value: overview.activeSessionsToday,
          icon: Sword,
          color: "text-purple-400",
        },
        {
          label: "Revenus (Auj.)",
          value: `${overview.revenueToday} €`,
          icon: DollarSign,
          color: "text-green-400",
        },
        {
          label: "Total Utilisateurs",
          value: overview.totalUsers,
          icon: Users,
          color: "text-indigo-400",
        },
      ]
    : [];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black mb-2">Dashboard</h1>
          <p className="text-muted-foreground font-medium">
            Vue temps réel et performances de la plateforme.
          </p>
        </div>
        <div className="flex bg-secondary/50 p-1 rounded-xl">
          {["7d", "30d", "1y"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"}`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* LIVE NOW SECTION */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Now
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading && !overview
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-card/40 animate-pulse rounded-2xl"
                />
              ))
            : liveStats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={i}
                    className="bg-card/40 backdrop-blur-3xl border border-white/5 p-4 rounded-2xl shadow-xl flex items-center gap-4"
                  >
                    <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center shrink-0">
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-black">{stat.value}</p>
                      <p className="text-xs font-bold text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      {/* KPIs SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading && !overview
          ? null
          : kpis.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="bg-gradient-to-br from-card/60 to-card/20 backdrop-blur-3xl border border-white/10 p-6 rounded-2xl shadow-xl"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                  <p className="text-3xl font-black">{stat.value}</p>
                  <p className="text-sm font-bold text-muted-foreground mt-1">
                    {stat.label}
                  </p>
                </div>
              );
            })}
      </div>

      {/* CHARTS */}
      <div className="bg-card/40 backdrop-blur-3xl border border-white/10 p-6 rounded-2xl shadow-xl h-[450px]">
        <h2 className="text-xl font-bold mb-6">Évolution de la plateforme</h2>
        {loading && chartData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            Chargement...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#ffffff10"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020F24",
                  borderColor: "#ffffff20",
                  borderRadius: "12px",
                }}
                itemStyle={{ fontWeight: "bold" }}
              />
              <Line
                type="monotone"
                name="Utilisateurs"
                dataKey="users"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
              />
              <Line
                type="monotone"
                name="Revenus (€)"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={3}
                dot={false}
              />
              <Line
                type="monotone"
                name="Parties"
                dataKey="games"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
