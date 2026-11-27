# Web Next.js — Regras

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, SWR, Recharts, Leaflet, Three/R3F, framer-motion.

## Estrutura

| Local | Uso |
| :--- | :--- |
| `app/<modulo>/page.tsx` | Rotas (`watch`, `vigil`, `previsao`, `tecnico`) |
| `components/ui/` | Componentes visuais reutilizáveis |
| `components/charts/` | Gráficos Recharts |
| `components/layout/` | Header, Footer |
| `components/providers/` | Contextos (tema) |
| `lib/types.ts` | Tipos — espelham `docs/api-contrato.md` |
| `lib/api.ts` | Client único + hooks SWR (base `NEXT_PUBLIC_API_URL`) |
| `lib/mock-data.ts` | Apenas fallback em desenvolvimento |

## Regras

- TypeScript estrito; sem `any`. Tipos novos em `lib/types.ts`.
- Dados sempre via hooks de `lib/api.ts`; não faça `fetch` solto em componentes.
- Trate os estados **loading / erro / vazio** em toda tela com dados.
- Leaflet e Three: `"use client"` + `dynamic(() => import(...), { ssr: false })`.
- Reaproveite componentes existentes antes de criar novos.
- Acessibilidade: respeite o `AccessibilityMenu`, `aria-*` em alertas, contraste adequado.
- Estilo com Tailwind; evite CSS inline.

## Validação

`npm run lint` e `npm run build` em `web/`. Verificar visualmente em `http://localhost:8080`.
Skill: `pagina-web`.
