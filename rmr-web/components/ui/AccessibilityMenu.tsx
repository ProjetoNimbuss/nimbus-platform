"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Eye, Type, ZoomIn, ZoomOut, Contrast, Info, X } from "lucide-react";

export default function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState(16); // Base 16px

  useEffect(() => {
    // Check saved preferences
    const savedContrast = localStorage.getItem("a11y-high-contrast") === "true";
    const savedFontSize = parseInt(localStorage.getItem("a11y-font-size") || "16", 10);
    
    setIsHighContrast(savedContrast);
    setFontSize(savedFontSize);

    applyHighContrast(savedContrast);
    applyFontSize(savedFontSize);
  }, []);

  const applyHighContrast = (active: boolean) => {
    if (active) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
    localStorage.setItem("a11y-high-contrast", active.toString());
  };

  const applyFontSize = (size: number) => {
    document.documentElement.style.fontSize = `${size}px`;
    localStorage.setItem("a11y-font-size", size.toString());
  };

  const toggleHighContrast = () => {
    const newState = !isHighContrast;
    setIsHighContrast(newState);
    applyHighContrast(newState);
  };

  const increaseFont = () => {
    if (fontSize < 24) {
      const newSize = fontSize + 2;
      setFontSize(newSize);
      applyFontSize(newSize);
    }
  };

  const decreaseFont = () => {
    if (fontSize > 12) {
      const newSize = fontSize - 2;
      setFontSize(newSize);
      applyFontSize(newSize);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="flex flex-col gap-2 bg-[var(--color-bg-surface)] border border-[var(--color-border)] p-2 rounded-2xl shadow-xl"
            role="menu"
            aria-label="Menu de opções de acessibilidade"
          >
            <button
              onClick={toggleHighContrast}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                isHighContrast 
                  ? "bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]" 
                  : "hover:bg-[var(--color-bg-surface-alt)] text-[var(--color-text-primary)]"
              }`}
              role="menuitem"
              aria-pressed={isHighContrast}
              aria-label="Alternar Alto Contraste"
            >
              <Contrast size={18} aria-hidden="true" />
              Alto Contraste
            </button>
            <button
              onClick={() => {
                setIsGlossaryOpen(true);
                setIsOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--color-bg-surface-alt)] text-[var(--color-text-primary)]"
              role="menuitem"
              aria-label="Abrir Glossário"
            >
              <Info size={18} aria-hidden="true" />
              Glossário de Termos
            </button>
            <div className="h-px w-full bg-[var(--color-border)] my-1" role="separator" />
            <div className="flex items-center gap-2">
              <button
                onClick={decreaseFont}
                disabled={fontSize <= 12}
                className="flex items-center justify-center p-2 rounded-xl hover:bg-[var(--color-bg-surface-alt)] text-[var(--color-text-primary)] disabled:opacity-50"
                role="menuitem"
                aria-label="Diminuir tamanho da fonte"
              >
                <ZoomOut size={18} aria-hidden="true" />
              </button>
              <span 
                className="text-xs font-semibold w-8 text-center text-[var(--color-text-secondary)]"
                aria-live="polite"
              >
                {Math.round((fontSize / 16) * 100)}%
              </span>
              <button
                onClick={increaseFont}
                disabled={fontSize >= 24}
                className="flex items-center justify-center p-2 rounded-xl hover:bg-[var(--color-bg-surface-alt)] text-[var(--color-text-primary)] disabled:opacity-50"
                role="menuitem"
                aria-label="Aumentar tamanho da fonte"
              >
                <ZoomIn size={18} aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGlossaryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setIsGlossaryOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="glossary-title"
            >
              <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
                <h2 id="glossary-title" className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <Info className="text-[var(--color-accent)]" />
                  Glossário
                </h2>
                <button
                  onClick={() => setIsGlossaryOpen(false)}
                  className="p-2 rounded-xl hover:bg-[var(--color-bg-surface-alt)] text-[var(--color-text-secondary)] transition-colors"
                  aria-label="Fechar Glossário"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6">
                <div>
                  <h3 className="font-semibold text-lg text-[var(--color-text-primary)] mb-2">Níveis de Alerta</h3>
                  <ul className="space-y-3">
                    <li className="flex gap-3 items-start">
                      <span className="w-3 h-3 rounded-full bg-[#18794E] mt-1 shrink-0"></span>
                      <div>
                        <strong className="text-[var(--color-text-primary)] block">Normal</strong>
                        <span className="text-sm text-[var(--color-text-secondary)]">Situação climática típica, sem previsão de chuvas significativas que causem impacto.</span>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="w-3 h-3 rounded-full bg-[#E5A800] mt-1 shrink-0"></span>
                      <div>
                        <strong className="text-[var(--color-text-primary)] block">Atenção</strong>
                        <span className="text-sm text-[var(--color-text-secondary)]">Possibilidade de chuva moderada a forte. Risco leve de alagamentos isolados. Recomenda-se acompanhamento.</span>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="w-3 h-3 rounded-full bg-[#F17316] mt-1 shrink-0"></span>
                      <div>
                        <strong className="text-[var(--color-text-primary)] block">Alerta</strong>
                        <span className="text-sm text-[var(--color-text-secondary)]">Chuvas intensas previstas ou em andamento. Alto risco de alagamentos e deslizamentos. Ações preventivas são necessárias.</span>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="w-3 h-3 rounded-full bg-[#EF4444] mt-1 shrink-0"></span>
                      <div>
                        <strong className="text-[var(--color-text-primary)] block">Emergência</strong>
                        <span className="text-sm text-[var(--color-text-secondary)]">Condição extrema. Precipitação severa causando múltiplos desastres simultâneos. Acionamento total da Defesa Civil.</span>
                      </div>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg text-[var(--color-text-primary)] mb-2">Termos Técnicos</h3>
                  <dl className="space-y-4">
                    <div>
                      <dt className="font-semibold text-[var(--color-text-primary)]">Milímetros (mm)</dt>
                      <dd className="text-sm text-[var(--color-text-secondary)] mt-1">Medida de precipitação. 1 mm de chuva equivale a 1 litro de água distribuído em uma área de 1 metro quadrado.</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-[var(--color-text-primary)]">Precipitação 24h</dt>
                      <dd className="text-sm text-[var(--color-text-secondary)] mt-1">Acumulado total de chuva registrado nas últimas 24 horas ininterruptas.</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-[var(--color-text-primary)]">Índice de Risco</dt>
                      <dd className="text-sm text-[var(--color-text-secondary)] mt-1">Um valor calculado com base na intensidade da chuva e na vulnerabilidade da área (relevo, população), usado para definir a severidade do alerta.</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-accent)] text-white shadow-lg hover:scale-105 transition-transform focus:ring-4 focus:ring-[var(--color-accent-muted)] focus:outline-none"
        aria-label={isOpen ? "Fechar menu de acessibilidade" : "Abrir menu de acessibilidade"}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Eye size={24} aria-hidden="true" />
      </button>
    </div>
  );
}
