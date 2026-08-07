import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AccessibilityMenu from "@/components/ui/AccessibilityMenu";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Alertas Climáticos — RMR",
  description:
    "Sistema de monitoramento e alerta contra eventos climáticos extremos para a Região Metropolitana do Recife. Dados de precipitação em tempo real, previsão de chuvas e pontos de alagamento.",
  keywords: [
    "alertas climáticos",
    "chuva recife",
    "alagamento",
    "RMR",
    "precipitação",
    "defesa civil",
    "monitoramento",
  ],
};

import AtmosphereWrapper from "@/components/ui/AtmosphereWrapper";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col gradient-bg relative">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-[var(--color-bg-primary)] focus:text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            Pular para o conteúdo principal
          </a>
          <AtmosphereWrapper />
          <Header />
          <main id="main-content" className="flex-1 z-10 relative" tabIndex={-1}>{children}</main>
          <Footer />
          <AccessibilityMenu />
        </ThemeProvider>
      </body>
    </html>
  );
}
