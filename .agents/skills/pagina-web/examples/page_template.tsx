"use client";

/**
 * Template de página Next.js tratando estados de Loading, Erro, Vazio e Sucesso.
 */

import React from "react";
import { useDadosRecurso } from "./api_client_template";

interface ItemRecurso {
  id: string;
  cidade: string;
  valor_mm: number | null;
  status: string;
}

export default function PaginaExemplo() {
  const { data: itens, error, isLoading } = useDadosRecurso<ItemRecurso[]>("/alertas");

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
        <span className="ml-3 text-slate-400">Carregando dados hidrometeorológicos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-lg text-red-200">
        <h3 className="font-semibold text-lg">Falha na comunicação com a API</h3>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  if (!itens || itens.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900/50 rounded-lg border border-slate-800 text-slate-400">
        Nenhum registro encontrado no momento.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-100">Monitoramento de Alertas</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {itens.map((item) => (
          <div key={item.id} className="p-4 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-xs uppercase font-mono text-cyan-400">{item.cidade}</span>
            <div className="text-xl font-bold mt-1">{item.valor_mm ?? 0} mm</div>
            <span className="text-xs text-slate-500">Status: {item.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
