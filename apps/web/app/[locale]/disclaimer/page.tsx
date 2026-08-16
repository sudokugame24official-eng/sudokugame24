"use client";
import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, FileText, Server } from "lucide-react";

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-[#041E42] text-white py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight uppercase">
            Mentions <span className="text-gray-400">Légales</span>
          </h1>
        </motion.div>

        <div className="bg-[#0A2A5C]/80 backdrop-blur-md rounded-3xl p-8 border border-white/10 space-y-8">
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-4 mb-4">
              <Server className="w-6 h-6 text-[#00BFFF]" />
              <h2 className="text-2xl font-bold">
                1. Éditeur du Site & Hébergement
              </h2>
            </div>
            <p className="text-gray-300 leading-relaxed mb-2">
              Le présent site web "Sudoku Premium" est édité par l'équipe de
              développement Sudoku Pro.
            </p>
            <p className="text-gray-300 leading-relaxed">
              <strong>Hébergement :</strong> Ce site est hébergé de manière
              professionnelle sur un VPS privé fourni par Hostinger.
            </p>
          </motion.section>

          <div className="h-px w-full bg-white/10" />

          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-4 mb-4">
              <AlertCircle className="w-6 h-6 text-[#FF4500]" />
              <h2 className="text-2xl font-bold">
                2. Limitation de Responsabilité
              </h2>
            </div>
            <p className="text-gray-300 leading-relaxed mb-4">
              Le site et les jeux sont fournis "en l'état" sans garantie
              d'aucune sorte. Bien que nous fassions de notre mieux pour assurer
              une disponibilité de 99.9%, nous ne saurions être tenus
              responsables des :
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>
                Interruptions temporaires du service pour cause de maintenance.
              </li>
              <li>
                Pertes de progression ou d'historique de parties dues à un
                problème technique ou réseau hors de notre contrôle.
              </li>
              <li>Dommages indirects liés à l'utilisation de la plateforme.</li>
            </ul>
          </motion.section>

          <div className="h-px w-full bg-white/10" />

          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold mb-4">
              3. Propriété Intellectuelle
            </h2>
            <p className="text-gray-300 leading-relaxed">
              L'ensemble des éléments graphiques, l'algorithme de génération de
              grilles, le logo, et le code source de l'interface (hors
              dépendances Open Source) sont la propriété exclusive des créateurs
              de Sudoku Premium. Toute reproduction non autorisée est interdite.
            </p>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
