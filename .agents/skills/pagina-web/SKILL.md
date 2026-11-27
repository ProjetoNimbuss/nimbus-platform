---
name: pagina-web
description: >-
  Use quando for criar ou alterar telas, dashboards, gráficos (Recharts), mapas (Leaflet)
  ou visualizações 3D no frontend Next.js do Nimbus, incluindo integração com a API.
---

# Página / componente no frontend

Leia `web/AGENTS.md`.

## Passos

1. **Tipos** — em `lib/types.ts`, espelhando `docs/api-contrato.md`.
2. **Dados** — em `lib/api.ts` (ver modelo completo em [api_client_template.ts](examples/api_client_template.ts)):
   Enquanto a API não existir, o hook pode cair em `lib/mock-data.ts` — sinalize isso ao usuário.
3. **Componentes** — reutilize `components/ui`, `components/charts` antes de criar.
   Novo componente: um por arquivo, PascalCase, props tipadas.
4. **Página** — `app/<modulo>/page.tsx` (ver padrão de estados em [page_template.tsx](examples/page_template.tsx)).
   Mapas/3D com `dynamic(..., { ssr: false })`.
5. **Estados** — loading (skeleton), erro (mensagem + retry), vazio.
6. **Acessibilidade e responsividade** — `aria-*`, foco, mobile-first com Tailwind.
7. **Validar** — em `web/`: `npm run lint` e `npm run build`.
8. **Verificação visual** — `task up:web` → `http://localhost:8080/<modulo>`; se possível, capture screenshot.

## Checklist

- [ ] Tipos · [ ] Hook SWR · [ ] Estados loading/erro/vazio · [ ] Lint + build · [ ] Conferido no navegador
