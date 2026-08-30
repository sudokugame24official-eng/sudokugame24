"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  MessageSquare,
  AlertTriangle,
  Briefcase,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { Link } from "@/navigation";

export default function ContactPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("Technical Support");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      if (!user) {
        toast.error("Veuillez vous connecter pour ouvrir un ticket de support.");
        setSubmitting(false);
        return;
      }

      const res = await fetch(`${API_URL}/support/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `[${topic}] ${name ? `${name} - ` : ""}${message.slice(0, 45)}...`,
          description: message.trim(),
          topic,
        }),
        credentials: "include",
      });

      if (res.ok) {
        setSubmitted(true);
        toast.success("Votre ticket de support a été transmis à l'équipe !");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || "Erreur lors de l'envoi du ticket.");
      }
    } catch {
      toast.error("Erreur de connexion au serveur.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tight">
            Support & Contact
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Besoin d'aide ? Une question sur votre compte ou un bug ? Notre équipe d'assistance vous répond rapidement.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-card border border-border p-6 rounded-2xl text-center">
            <div className="w-12 h-12 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <HelpCircle className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold mb-2">Assistance & Aide</h3>
            <p className="text-sm text-muted-foreground">
              Un problème avec votre compte ou une grille de Sudoku ?
            </p>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl text-center">
            <div className="w-12 h-12 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-bold mb-2">Signalement & Sécurité</h3>
            <p className="text-sm text-muted-foreground">
              Signaler un comportement inapproprié ou un bug.
            </p>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl text-center">
            <div className="w-12 h-12 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
              <Briefcase className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="font-bold mb-2">Partenariats</h3>
            <p className="text-sm text-muted-foreground">
              Demandes professionnelles et collaborations.
            </p>
          </div>
        </div>

        <div className="bg-card border border-border p-8 rounded-3xl max-w-2xl mx-auto shadow-2xl">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-black mb-2">Ticket Envoyé avec Succès !</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Votre ticket est désormais enregistré et visible par nos administrateurs dans le Centre de Support.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setMessage("");
                }}
                className="px-6 py-3 bg-secondary hover:bg-secondary/80 font-bold rounded-xl text-sm transition-all"
              >
                Envoyer un autre message
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {!user && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-yellow-400 text-sm font-medium flex items-center justify-between">
                  <span>Connectez-vous pour lier ce ticket à votre compte.</span>
                  <Link
                    href="/auth"
                    className="px-3 py-1.5 bg-yellow-500 text-black font-black rounded-lg text-xs hover:bg-yellow-400"
                  >
                    Se Connecter
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Votre Nom / Pseudo</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={user?.profile?.username || "Joueur"}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Adresse Email</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={user?.email || "joueur@sudoku.com"}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold">Motif de la demande</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Technical Support">Support Technique / Bug</option>
                  <option value="Account Issue">Problème de Compte / Connexion</option>
                  <option value="Coin Economy">Question sur les Pièces / Boutique</option>
                  <option value="Report Abuse">Signalement de Comportement</option>
                  <option value="General Inquiry">Demande Générale</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold">Votre Message</label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Décrivez précisément votre problème ou votre question..."
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-primary text-primary-foreground font-black text-lg rounded-xl uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Envoi en cours...
                  </>
                ) : (
                  "Envoyer le Ticket"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
