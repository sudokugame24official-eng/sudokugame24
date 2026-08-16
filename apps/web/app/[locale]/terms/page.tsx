"use client";
import React from "react";
import { motion } from "framer-motion";
import { Scale, AlertTriangle, Users, Sword } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#041E42] text-white py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 bg-[#FFCC00]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Scale className="w-8 h-8 text-[#FFCC00]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight uppercase">
            Conditions Générales{" "}
            <span className="text-[#FFCC00]">d'Utilisation</span>
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
              <Users className="w-6 h-6 text-[#00BFFF]" />
              <h2 className="text-2xl font-bold">
                1. Accès au Service & Comptes
              </h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              En utilisant Sudoku Premium, vous acceptez d'être lié par ces CGU.
              Vous êtes responsable du maintien de la confidentialité de vos
              identifiants. Toute activité réalisée sous votre compte est
              considérée comme étant la vôtre. Nous nous réservons le droit de
              suspendre ou de supprimer un compte inactif ou enfreignant ces
              règles.
            </p>
          </motion.section>

          <div className="h-px w-full bg-white/10" />

          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-4 mb-4">
              <Sword className="w-6 h-6 text-[#FF4500]" />
              <h2 className="text-2xl font-bold">
                2. Politique Anti-Triche Sévère
              </h2>
            </div>
            <p className="text-gray-300 leading-relaxed mb-4">
              Le cœur de Sudoku Premium repose sur la compétition équitable
              (Mode Duel, Tournois).
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>
                L'utilisation de logiciels tiers, scripts, ou "Sudoku Solvers"
                externes est strictement interdite.
              </li>
              <li>
                L'exploitation de bugs (glitches) à des fins d'avantage
                compétitif entraînera une réinitialisation de l'Elo.
              </li>
              <li>
                Toute triche avérée entraînera un{" "}
                <strong className="text-white">Bannissement Définitif</strong>{" "}
                de l'adresse IP et du compte.
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
              <AlertTriangle className="w-6 h-6 text-[#FFCC00]" />
              <h2 className="text-2xl font-bold">
                3. Comportement sur le Forum & Chat
              </h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Le respect mutuel est exigé. Les propos injurieux, racistes, le
              harcèlement, ou le spam (publicité non autorisée) dans le Chat en
              direct ou sur le Forum entraîneront une sanction par nos
              Modérateurs (Sourdine temporaire ou Ban).
            </p>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
