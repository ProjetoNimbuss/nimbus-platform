"use client";

import { useState, useRef, useEffect } from "react";
import { ForecastHour } from "@/lib/types";
import { CloudRain, CloudLightning, Sun, Moon, Droplets, Wind } from "lucide-react";
import { formatMM } from "@/lib/utils";

interface HourlyGyroscopeProps {
  hours: ForecastHour[];
}

export default function HourlyGyroscope({ hours }: HourlyGyroscopeProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    handleSelect(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (idx: number) => {
    setSelectedIndex(idx);
    if (scrollRef.current) {
      const el = scrollRef.current.children[1 + idx] as HTMLElement; // +1 to skip the <style> tag
      if (el) {
        const parentRect = scrollRef.current.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const scrollLeft = el.offsetLeft - parentRect.width / 2 + elRect.width / 2;
        scrollRef.current.scrollTo({ left: scrollLeft, behavior: "smooth" });
      }
    }
  };

  const selectedHour = hours[selectedIndex];
  if (!selectedHour) return null;

  const date = new Date(selectedHour.datetime);
  const hourNum = date.getHours();
  const isDay = hourNum >= 6 && hourNum < 18;

  const bgClass = isDay 
    ? "bg-gradient-to-br from-sky-400 to-blue-500 text-white" 
    : "bg-gradient-to-br from-indigo-950 to-slate-900 text-slate-100";

  return (
    <div className={`relative overflow-hidden rounded-2xl transition-colors duration-1000 ${bgClass} shadow-md`}>
      {/* Estrelas e Lua para a noite */}
      {!isDay && selectedHour.precipitacao_mm < 5 && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-1000">
          {/* Estrelas */}
          <div className="absolute top-6 left-[15%] w-1.5 h-1.5 bg-white rounded-full animate-pulse opacity-70"></div>
          <div className="absolute top-12 left-[30%] w-1 h-1 bg-white rounded-full animate-pulse opacity-40" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-8 left-[60%] w-2 h-2 bg-white rounded-full animate-pulse opacity-80" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-[40%] left-[80%] w-1.5 h-1.5 bg-white rounded-full animate-pulse opacity-50" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-[30%] left-[25%] w-1 h-1 bg-white rounded-full animate-pulse opacity-60" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute top-[20%] right-[10%] w-1 h-1 bg-white rounded-full animate-pulse opacity-90" style={{ animationDelay: '0.8s' }}></div>
          
          {/* Lua brilhante */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-slate-300 rounded-full blur-3xl opacity-10"></div>
          <div className="absolute top-6 right-12 w-12 h-12 bg-gradient-to-tr from-slate-300 to-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)]"></div>
        </div>
      )}

      {/* Sol brilhante para o dia */}
      {isDay && selectedHour.precipitacao_mm < 5 && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-1000">
          {/* Brilho externo */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-yellow-300 rounded-full blur-3xl opacity-30 animate-pulse"></div>
          {/* Corpo do sol */}
          <div className="absolute top-6 right-12 w-16 h-16 bg-gradient-to-tr from-yellow-300 to-yellow-100 rounded-full shadow-[0_0_40px_rgba(253,224,71,0.8)]"></div>
        </div>
      )}

      <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-end pr-10 overflow-hidden">
        {selectedHour.precipitacao_mm > 10 ? (
          <CloudLightning size={300} className="text-white animate-pulse transform translate-x-10 translate-y-10" />
        ) : selectedHour.precipitacao_mm > 0 ? (
          <CloudRain size={300} className="text-white transform translate-x-10 translate-y-10" />
        ) : isDay ? (
          <Sun size={300} className="text-yellow-200 transform translate-x-10 translate-y-10 animate-[spin_60s_linear_infinite]" />
        ) : (
          <Moon size={300} className="text-slate-200 transform translate-x-10 translate-y-10" />
        )}
      </div>

      <div className="relative z-10 p-6 flex flex-col lg:flex-row items-center lg:items-stretch gap-8">
        <div className="flex-shrink-0 flex flex-col items-center lg:items-start justify-center min-w-[200px]">
          <span className="text-5xl font-bold font-mono tracking-tighter drop-shadow-md">
            {String(hourNum).padStart(2, '0')}:00
          </span>
          <span className="text-sm font-medium opacity-80 uppercase tracking-widest mt-1">
            {isDay ? "Dia" : "Noite"}
          </span>
          
          <div className="mt-8 flex items-center gap-5">
            <div className="flex flex-col items-center">
              <Droplets size={24} className={selectedHour.precipitacao_mm > 0 ? "text-blue-200" : "opacity-50"} />
              <span className="mt-2 text-lg font-bold">{formatMM(selectedHour.precipitacao_mm)}</span>
              <span className="text-xs opacity-70">Chuva</span>
            </div>
            <div className="h-10 w-px bg-white/20"></div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold mt-1">{selectedHour.temperatura_c}°</span>
              <span className="text-xs opacity-70 mt-1">Temp</span>
            </div>
            <div className="h-10 w-px bg-white/20"></div>
            <div className="flex flex-col items-center">
              <Wind size={24} className="opacity-70" />
              <span className="mt-2 text-sm font-bold">{selectedHour.vento_kmh} km/h</span>
              <span className="text-xs opacity-70">Vento</span>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full max-w-full overflow-hidden relative border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-6">
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto gap-2 pb-4 pt-8 px-[50%] snap-x snap-mandatory items-end h-full scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style dangerouslySetInnerHTML={{__html: `::-webkit-scrollbar { display: none; }`}} />
            
            {hours.map((h, i) => {
              const hDate = new Date(h.datetime);
              const hNum = hDate.getHours();
              const isSelected = i === selectedIndex;
              
              const heightPercent = h.precipitacao_mm === 0 
                ? 0 
                : Math.max(15, Math.min(100, (h.precipitacao_mm / 20) * 100));

              return (
                <div 
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`flex flex-col items-center justify-end snap-center cursor-pointer transition-all duration-300 ${isSelected ? "opacity-100 scale-110 -translate-y-2" : "opacity-40 hover:opacity-70"} min-w-[4rem]`}
                >
                  <div className="w-full flex justify-center mb-3 h-24 items-end">
                    {h.precipitacao_mm > 0 ? (
                      <div 
                        className={`w-6 rounded-t-md transition-all duration-500 ${isSelected ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'bg-white/50'}`} 
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                    ) : (
                      <div className="w-6 h-1 rounded-full bg-white/20"></div>
                    )}
                  </div>
                  <span className={`text-sm font-mono ${isSelected ? "font-bold text-white drop-shadow-md" : "font-medium"}`}>
                    {String(hNum).padStart(2, '0')}h
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-4 h-1 bg-white rounded-full"></div>
        </div>

      </div>
    </div>
  );
}
