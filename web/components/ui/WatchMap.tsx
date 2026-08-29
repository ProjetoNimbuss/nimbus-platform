"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { mockMunicipalities } from "@/lib/mock-data";
import { ALERT_CONFIG } from "@/lib/constants";

interface WatchMapProps {
  onSelectMunicipality: (slug: string) => void;
}

export default function WatchMap({ onSelectMunicipality }: WatchMapProps) {
  return (
    <div className="w-full h-full bg-[var(--color-bg-surface)]">
      <style>{`
        .leaflet-container {
          background: var(--color-bg-surface) !important;
          font-family: var(--font-sans);
        }
        .custom-tooltip {
          background: rgba(15, 23, 42, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: white !important;
          font-weight: 500 !important;
          border-radius: 8px !important;
          padding: 6px 10px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
        }
        .leaflet-tooltip-left.custom-tooltip::before { border-left-color: rgba(15, 23, 42, 0.95) !important; }
        .leaflet-tooltip-right.custom-tooltip::before { border-right-color: rgba(15, 23, 42, 0.95) !important; }
        .leaflet-tooltip-top.custom-tooltip::before { border-top-color: rgba(15, 23, 42, 0.95) !important; }
        .leaflet-tooltip-bottom.custom-tooltip::before { border-bottom-color: rgba(15, 23, 42, 0.95) !important; }
        
        /* Ajuste do controle de zoom para não ficar sob o side panel */
        .leaflet-control-zoom {
          margin-bottom: 2rem !important;
          margin-left: 1rem !important;
          border: none !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }
        .leaflet-control-zoom a {
          background: var(--color-bg-surface) !important;
          color: var(--color-text-primary) !important;
          border: 1px solid var(--color-border) !important;
        }
      `}</style>
      
      <MapContainer
        center={[-8.0476, -34.8770]}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <ZoomControl position="bottomleft" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {mockMunicipalities.map((mun) => {
          const alertConfig = ALERT_CONFIG[mun.nivel_alerta];
          
          return (
            <CircleMarker
              key={mun.slug}
              center={[mun.latitude, mun.longitude]}
              pathOptions={{
                color: alertConfig.color,
                fillColor: alertConfig.color,
                fillOpacity: 0.7,
                weight: 2,
              }}
              radius={14}
              eventHandlers={{
                click: () => onSelectMunicipality(mun.slug),
                mouseover: (e) => {
                  const layer = e.target;
                  layer.setStyle({ fillOpacity: 0.9, radius: 18 });
                },
                mouseout: (e) => {
                  const layer = e.target;
                  layer.setStyle({ fillOpacity: 0.7, radius: 14 });
                }
              }}
            >
              <Tooltip className="custom-tooltip" direction="top" offset={[0, -15]} opacity={1}>
                {mun.nome}
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
