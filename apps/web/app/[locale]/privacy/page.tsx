"use client";
import React from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, Database } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#041E42] text-white py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 bg-[#00BFFF]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-[#00BFFF]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight uppercase">
            Politique de <span className="text-[#00BFFF]">Confidentialité</span>
          </h1>
          <p className="text-gray-400">
            Dernière mise à jour : {new Date().toLocaleDateString()}
          </p>
        </motion.div>

        <div className="bg-[#0A2A5C]/80 backdrop-blur-md rounded-3xl p-8 border border-white/10 space-y-8">
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-4 mb-4">
              <Database className="w-6 h-6 text-[#FFCC00]" />
              <h2 className="text-2xl font-bold">1. Collecte des Données</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Nous accordons une grande importance à la protection de vos
              données. Sudoku Premium collecte uniquement les informations
              strictement nécessaires pour vous offrir une expérience de jeu
              optimale :
            </p>
            <ul className="list-disc list-inside text-gray-300 mt-4 space-y-2 ml-4">
              <li>
                Adresse e-mail (pour l'authentification et la récupération de
                compte).
              </li>
              <li>
                Données de jeu (Temps de résolution, matchs gagnés) pour le
                calcul de votre classement Elo.
              </li>
              <li>
                Informations de session (Cookies) nécessaires à votre maintien
                en ligne.
              </li>
            </ul>
          </motion.section>

          <div className="h-px w-full bg-white/10" />

          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-4 mb-4">
              <Lock className="w-6 h-6 text-[#00BFFF]" />
              <h2 className="text-2xl font-bold">2. Protection & Sécurité</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Vos mots de passe ne sont jamais stockés en clair. Nous utilisons
              les algorithmes de hachage les plus récents (Bcrypt) et des
              protocoles chiffrés (JWT) pour sécuriser vos sessions. Notre
              architecture en conteneurs Docker garantit une isolation parfaite
              des bases de données.
            </p>
          </motion.section>

          <div className="h-px w-full bg-white/10" />

          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-4 mb-4">
              <Eye className="w-6 h-6 text-[#FF4500]" />
              <h2 className="text-2xl font-bold">
                3. Partage aux Tiers & Publicité
              </h2>
            </div>
            <p className="text-gray-300 leading-relaxed mb-4">
              Nous ne revendons <strong className="text-white">jamais</strong>{" "}
              vos données personnelles à des courtiers en données.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Afin de maintenir la plateforme gratuite, nous affichons des
              publicités gérées par Google AdSense. Google peut utiliser des
              cookies pour diffuser des annonces pertinentes basées sur vos
              visites antérieures. Vous pouvez désactiver la publicité
              personnalisée en visitant les paramètres de votre compte Google.
            </p>
          </motion.section>

          <div className="h-px w-full bg-white/10" />

          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold mb-4">4. Vos Droits (RGPD)</h2>
            <p className="text-gray-300 leading-relaxed">
              Conformément à la réglementation européenne (RGPD), vous disposez
              d'un droit d'accès, de rectification, et de suppression totale de
              vos données. Pour exercer ce droit, veuillez utiliser le système
              de ticket de support depuis votre Panneau d'Administration ou nous
              contacter directement.
            </p>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
