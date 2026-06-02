import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col gradient-bg">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
