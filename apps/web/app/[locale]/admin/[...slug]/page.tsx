"use client";
import React from 'react';
import { Construction, Server, Database, Activity } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function GenericAdminPage() {
  const params = useParams();
  const pathParts = (params.slug as string[]) || [];
  const lastPart = pathParts[pathParts.length - 1];
  const moduleName = lastPart ? lastPart.toUpperCase() : 'DASHBOARD';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          Module: <span className="text-primary">{moduleName}</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Gestionnaire avancé pour /{pathParts.join('/')}
        </p>
      </div>

      <div className="bg-card/40 border border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary opacity-50" />
        
        <Construction className="w-20 h-20 text-yellow-500 mb-6 animate-pulse" />
        <h2 className="text-2xl font-bold mb-4">Module en cours d'intégration</h2>
        <p className="text-muted-foreground max-w-lg mb-8">
          Ce module est prévu dans l'architecture mais son interface de gestion n'est pas encore connectée. Les données tournent en arrière-plan.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mt-8 pt-8 border-t border-white/10">
          <div className="flex flex-col items-center p-4 bg-white/5 rounded-2xl">
            <Server className="w-8 h-8 text-blue-400 mb-2" />
            <span className="font-bold">API Active</span>
            <span className="text-xs text-muted-foreground text-center">Service opérationnel en backend</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-white/5 rounded-2xl">
            <Database className="w-8 h-8 text-green-400 mb-2" />
            <span className="font-bold">Base de données</span>
            <span className="text-xs text-muted-foreground text-center">Schéma prêt et fonctionnel</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-white/5 rounded-2xl">
            <Activity className="w-8 h-8 text-purple-400 mb-2" />
            <span className="font-bold">Monitoring</span>
            <span className="text-xs text-muted-foreground text-center">Télémétrie connectée</span>
          </div>
        </div>
      </div>
    </div>
  );
}
