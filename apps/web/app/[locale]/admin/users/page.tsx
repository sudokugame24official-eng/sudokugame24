"use client";
import React, { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { Users, Shield, Ban, CheckCircle, Search } from "lucide-react";

export default function UsersAdmin() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (id: string, role: string) => {
    await fetch(`${API_URL}/admin/users/${id}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ role }),
    });
    fetchUsers();
  };

  const handleBan = async (id: string, isBanned: boolean) => {
    const action = isBanned ? "unban" : "ban";
    const body = isBanned ? {} : { reason: "Banni par un administrateur" };
    
    await fetch(`${API_URL}/admin/users/${id}/${action}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(body),
    });
    fetchUsers();
  };

  if (loading) return <div className="text-center mt-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <Users className="text-primary" /> Gestion des Utilisateurs
        </h1>
        <p className="text-muted-foreground mt-2">
          Gérez les comptes, les rôles et les sanctions des membres de la communauté.
        </p>
      </div>

      <div className="bg-card/40 border border-white/10 rounded-[2rem] p-8 shadow-xl">
        <div className="relative mb-6">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Rechercher un utilisateur (email, pseudo)..." 
            className="w-full bg-secondary/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-muted-foreground text-sm">
                <th className="pb-4 font-bold">Email</th>
                <th className="pb-4 font-bold">Rôle</th>
                <th className="pb-4 font-bold">Statut</th>
                <th className="pb-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-4 font-medium">{u.email}</td>
                  <td className="py-4">
                    <select 
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="bg-secondary border border-white/10 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="MEMBER">Membre</option>
                      <option value="MODERATOR">Modérateur</option>
                      <option value="ADMIN">Administrateur</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </select>
                  </td>
                  <td className="py-4">
                    {u.isBanned ? (
                      <span className="inline-flex items-center gap-1 text-red-400 bg-red-400/10 px-2 py-1 rounded-full text-xs font-bold">
                        <Ban className="w-3 h-3" /> Banni
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-1 rounded-full text-xs font-bold">
                        <CheckCircle className="w-3 h-3" /> Actif
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-right">
                    <button 
                      onClick={() => handleBan(u.id, u.isBanned)}
                      className={`text-sm font-bold px-4 py-2 rounded-lg transition-colors ${
                        u.isBanned 
                          ? "bg-white/10 hover:bg-white/20 text-white" 
                          : "bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white"
                      }`}
                    >
                      {u.isBanned ? "Débannir" : "Bannir"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
