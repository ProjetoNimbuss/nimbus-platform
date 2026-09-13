# Documentação da Branch: feat/wireframes-nimbus-watch-vigil

Esta documentação resume todas as implementações, correções e remoções de código realizadas durante o desenvolvimento da branch de wireframes para os sistemas Watch e Vigil.

## 1. Nimbus Watch
- **Dashboard Operacional (`web/app/watch/page.tsx`):** Implementada a interface principal de monitoramento em tempo real (Watch), focada em visão situacional da Região Metropolitana do Recife.
- **Mapa Tático (`web/components/ui/WatchMap.tsx`):** Componente de mapa tático integrado com painéis flutuantes, radar meteorológico e listagem de estações em estado crítico.
- **Monitoramento de Municípios (`web/components/ui/MunicipalityCard.tsx`):** Criação de cards com expansão de detalhes, métricas de precipitação em 1h/24h, indicativo de tendência pluviométrica e mockups de relatos comunitários (crowdsourcing).
- **Indicadores Horários (`web/components/ui/HourlyGyroscope.tsx`):** Componente para exibição visual circular ou direcional da tendência climática das próximas horas.

## 2. Nimbus Vigil
- **Dashboard Analítico (`web/app/vigil/page.tsx`):** Interface voltada para a análise histórica e de séries temporais de precipitações.
- **Gráficos (`web/components/charts/VigilCharts.tsx`):** Integração com `recharts` para plotagem de acumulados diários em painéis interativos.
- **Adequação da Regra de Negócio:** Remoção de indicadores irreais no frontend sobre "Níveis de Rios" (pois a informação não compõe a massa de dados atual) e remoção da inferência estática de "Nível de Risco" (uma vez que os mesmos 80mm de chuva representam ameaças distintas em áreas de morro vs planície).
- **Resolução de SSR e Hydration:** Correção estrutural na página de Vigil, introduzindo um pattern com `useEffect` e `mounted` para impedir o erro de *Hydration Mismatch* do Next.js ocasionado por gerações randômicas de números na renderização do servidor.

## 3. Backend, Infraestrutura e Banco de Dados
- **Mapeamento de Domínios (`api/database/schema.sql`):** Criação do esquema base relacional no PostgreSQL, segmentando o banco nos esquemas `auth` (usuários, perfis e localizações), `catalog` (eventos severos), `reports` (ocorrências colaborativas e upvotes/downvotes), `notifications` e `telemetry`.
- **Correção no Docker Compose (`docker-compose.yml`):** Ajuste dos diretórios de mapeamento (`working_dir`) e da rota de execução de pacotes pip (`../requirements.txt`) para o contêiner `nimbus_api`, permitindo que o FastAPI/Uvicorn inicialize corretamente via compose.
- **Otimização de Build (`.dockerignore`):** Implementação de uma robusta política de ignore (`node_modules`, `venv`, `data`, `.git`), mitigando o carregamento indevido de gigabytes de dados no daemon do Docker.
- **Correção em Providers (`web/components/providers/ThemeProvider.tsx`):** Atraso de hidratação forçada no provedor de temas (`next-themes`) para contornar logs de erro relativos à injeção imperativa de tags `<script>` no servidor SSR em versões mais recentes do Next.js 14/15.
