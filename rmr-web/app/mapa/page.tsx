"use client";

import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/ui/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] flex items-center justify-center bg-gray-100 rounded-lg animate-pulse border border-gray-200">
      <span className="text-gray-500 font-medium">Carregando mapa interativo...</span>
    </div>
  ),
});

export default function MapaPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-130px)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
          Mapa de Monitoramento (CEMADEN)
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm max-w-3xl">
          Visualize as estações pluviométricas na Região Metropolitana do Recife. 
          Clique em um marcador para ver o histórico de precipitação das últimas 24 horas.
        </p>
      </div>
      
      <div className="w-full">
        <MapComponent />
      </div>
    </div>
  );
}
