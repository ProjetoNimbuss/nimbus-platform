"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Corrige o problema com os ícones default do Leaflet no Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Station {
  id: string;
  nome: string;
  cidade: string;
  latitude: number;
  longitude: number;
}

interface Precipitation {
  data_hora: string;
  chuva: number;
}

import { mockMunicipalities } from "@/lib/mock-data";
import { useMap } from "react-leaflet";

function MapFlyTo({ selectedSlug }: { selectedSlug?: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedSlug) {
      const mun = mockMunicipalities.find(m => m.slug === selectedSlug);
      if (mun) {
        map.flyTo([mun.latitude, mun.longitude], 12, { duration: 1.5 });
      }
    } else {
      map.flyTo([-8.0476, -34.8770], 10, { duration: 1.5 });
    }
  }, [selectedSlug, map]);
  
  return null;
}

export default function MapComponent({ selectedSlug }: { selectedSlug?: string | null }) {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [precipData, setPrecipData] = useState<Precipitation[]>([]);
  const [loadingPrecip, setLoadingPrecip] = useState(false);

  useEffect(() => {
    // Fetch das estações
    fetch("http://localhost:8000/api/v1/stations")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Filtra para garantir que recebemos estações válidas e não um array com objeto de erro
          setStations(data.filter(s => s.id !== undefined));
        }
      })
      .catch((err) => console.error("Error fetching stations:", err));
  }, []);

  const handleMarkerClick = (station: Station) => {
    setSelectedStation(station);
    setLoadingPrecip(true);
    fetch(`http://localhost:8000/api/v1/stations/${station.id}/precipitation`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Converte datas para um formato mais amigável para o chart
          const formattedData = data.map((d: any) => ({
            ...d,
            hora: new Date(d.data_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setPrecipData(formattedData);
        }
      })
      .catch((err) => console.error("Error fetching precipitation:", err))
      .finally(() => setLoadingPrecip(false));
  };

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-[var(--color-border)] shadow-md">
      <style>{`
        .leaflet-popup-content-wrapper {
          background: #ffffff !important;
          color: #000000 !important;
        }
        .leaflet-popup-tip {
          background: #ffffff !important;
        }
        .leaflet-popup-close-button {
          color: #000000 !important;
        }
      `}</style>
      <MapContainer
        center={[-8.0476, -34.8770]} // Default para Recife
        zoom={10}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapFlyTo selectedSlug={selectedSlug} />

        {stations.map((station) => (
          <Marker
            key={station.id}
            position={[station.latitude, station.longitude]}
            eventHandlers={{
              click: () => handleMarkerClick(station),
            }}
          >
            <Popup className="custom-popup">
              <div className="w-[300px]">
                <h3 className="font-bold text-lg mb-1 text-black">{station.nome}</h3>
                <p className="text-sm text-gray-600 mb-3 uppercase">{station.cidade}</p>
                
                {loadingPrecip ? (
                  <div className="text-center py-4 text-sm text-gray-500">Carregando dados...</div>
                ) : precipData.length > 0 ? (
                  <div className="h-[150px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={precipData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="hora" 
                          tick={{ fontSize: 10, fill: '#475569' }}
                          interval="preserveStartEnd" 
                        />
                        <YAxis 
                          tick={{ fontSize: 10, fill: '#475569' }} 
                          width={30}
                          domain={[0, 'dataMax']}
                          allowDataOverflow={false}
                        />
                        <Tooltip 
                          labelStyle={{ color: 'white' }}
                          formatter={(value: any) => [`${value} mm`, 'Chuva']}
                        />
                        <Line
                          type="monotone"
                          dataKey="chuva"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-gray-500">Sem dados recentes.</div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
