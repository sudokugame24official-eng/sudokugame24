"use client";
import React, { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import {
  LifeBuoy,
  AlertCircle,
  Clock,
  CheckCircle2,
  MessageSquare,
  Send,
  Users,
  ShieldAlert,
} from "lucide-react";

export default function SupportAdmin() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyContent, setReplyContent] = useState("");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/tickets`, {
        credentials: "include",
      });
      if (res.ok) setTickets(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetails = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/tickets/${id}`, {
        credentials: "include",
      });
      if (res.ok) setSelectedTicket(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyContent) return;
    try {
      const res = await fetch(
        `${API_URL}/admin/tickets/${selectedTicket.id}/reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: replyContent }),
          credentials: "include",
        },
      );
      if (res.ok) {
        setReplyContent("");
        loadTicketDetails(selectedTicket.id);
        fetchTickets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClose = async (id: string) => {
    try {
      await fetch(`${API_URL}/admin/tickets/${id}/close`, {
        method: "PATCH",
        credentials: "include",
      });
      loadTicketDetails(id);
      fetchTickets();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Left Column: Ticket List */}
      <div className="w-1/3 bg-card/40 border border-white/10 rounded-2xl flex flex-col overflow-hidden backdrop-blur-2xl">
        <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
          <h2 className="font-black text-lg">Support Tickets</h2>
          <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold">
            {tickets.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center text-muted-foreground p-8">
              Chargement...
            </div>
          ) : (
            tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => loadTicketDetails(t.id)}
                className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedTicket?.id === t.id ? "bg-primary/10 border-primary" : "bg-white/5 border-white/5 hover:bg-white/10"}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      t.status === "OPEN"
                        ? "bg-orange-500/20 text-orange-500"
                        : t.status === "CLOSED"
                          ? "bg-emerald-500/20 text-emerald-500"
                          : "bg-blue-500/20 text-blue-500"
                    }`}
                  >
                    {t.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    #{(t.id as string).substring(t.id.length - 6)}
                  </span>
                </div>
                <h3 className="font-bold text-sm mb-1 truncate">{t.title}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {t.user?.profile?.username || t.user?.email}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Ticket Detail */}
      <div className="flex-1 bg-card/40 border border-white/10 rounded-2xl flex flex-col overflow-hidden backdrop-blur-2xl">
        {!selectedTicket ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <LifeBuoy className="w-16 h-16 mb-4 opacity-20" />
            <p>Sélectionnez un ticket pour afficher les détails.</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-white/10 flex justify-between items-start bg-white/5">
              <div>
                <h2 className="text-2xl font-black mb-2">
                  {selectedTicket.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="font-medium text-white">
                    {selectedTicket.user?.email}
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(selectedTicket.createdAt).toLocaleString()}
                  </span>
                  <span>•</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      selectedTicket.status === "OPEN"
                        ? "bg-orange-500/20 text-orange-500"
                        : selectedTicket.status === "CLOSED"
                          ? "bg-emerald-500/20 text-emerald-500"
                          : "bg-blue-500/20 text-blue-500"
                    }`}
                  >
                    {selectedTicket.status}
                  </span>
                </div>
              </div>
              {selectedTicket.status !== "CLOSED" && (
                <button
                  onClick={() => handleClose(selectedTicket.id)}
                  className="bg-red-500/20 text-red-500 hover:bg-red-500/30 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                  Fermer le ticket
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Original Message */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex-1">
                  <p className="text-sm">{selectedTicket.description}</p>
                </div>
              </div>

              {/* Replies */}
              {selectedTicket.messages?.map((m: any) => (
                <div key={m.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-primary" />
                  </div>
                  <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-primary">
                        {m.author?.profile?.username || "Support Agent"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(m.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{m.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Box */}
            {selectedTicket.status !== "CLOSED" && (
              <form
                onSubmit={handleReply}
                className="p-4 border-t border-white/10 bg-white/5 flex gap-4"
              >
                <input
                  type="text"
                  placeholder="Répondre à l'utilisateur..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="flex-1 bg-secondary border border-white/10 rounded-xl px-4 focus:outline-none focus:border-primary"
                  required
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Envoyer
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
