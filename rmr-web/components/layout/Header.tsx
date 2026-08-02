"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_STANDARD, NAV_TECHNICAL } from "@/lib/constants";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, X } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const isTechnical = pathname.startsWith("/tecnico");
  const navItems = isTechnical ? NAV_TECHNICAL : NAV_STANDARD;
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white text-lg font-bold shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              🌧️
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-[var(--color-text-primary)] leading-tight">
                Alertas Climáticos
              </h1>
              <p className="text-[11px] font-medium text-[var(--color-text-muted)] leading-tight">
                Região Metropolitana do Recife
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = item.href === "/"
                ? pathname === "/"
                : item.href === "/tecnico"
                ? pathname === "/tecnico"
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "nav-link",
                    isActive && "active"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Mode Toggle + Status */}
          <div className="flex items-center gap-4">
            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span>Ao vivo</span>
            </div>

            {/* Theme Toggle (Desktop) */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-alt)] transition-colors"
              aria-label="Alternar tema"
            >
              {mounted && theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Mode Toggle */}
            <div className="mode-toggle">
              <Link
                href="/"
                className={cn(
                  "mode-toggle-btn",
                  !isTechnical && "active"
                )}
              >
                Padrão
              </Link>
              <Link
                href="/tecnico"
                className={cn(
                  "mode-toggle-btn",
                  isTechnical && "active"
                )}
              >
                Técnico
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-alt)] transition-colors"
              aria-label="Menu"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4 space-y-4 shadow-xl">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = item.href === "/"
                ? pathname === "/"
                : item.href === "/tecnico"
                ? pathname === "/tecnico"
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "nav-link block w-full",
                    isActive && "active"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {/* Theme Toggle Mobile */}
          <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">Modo Escuro</span>
            <button 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--color-bg-surface-alt)] text-[var(--color-text-primary)]"
            >
              {mounted && theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
