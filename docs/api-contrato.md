# Contrato de API: Frontend e Backend (Watch & Vigil)

Este documento define os contratos dos endpoints (APIs) que servirão de base para a comunicação entre o frontend e o backend do projeto, englobando os módulos Watch, Vigil, Alertas e Reports.

O prefixo base para todas as rotas listadas abaixo é `/api/v1`.

---

## 1. Alertas e Estações

### 1.1 Listar Alertas
- **Rota**: `GET /api/v1/alertas`
- **Descrição**: Retorna a lista de alertas ativos no sistema.
- **Parâmetros de Query** (Opcionais):
  - `status` (string): Filtra pelo status do alerta (ex: `ativo`, `resolvido`).
  - `nivel` (string): Filtra pela severidade (ex: `baixo`, `medio`, `alto`, `critico`).
- **Exemplo de Resposta (200 OK)**:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "estacao_id": "ST-001",
      "tipo": "chuva_forte",
      "nivel": "alto",
      "mensagem": "Precipitação acumulada superior a 50mm na última hora.",
      "data_emissao": "2026-08-23T19:00:00Z",
      "status": "ativo"
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "estacao_id": "ST-002",
      "tipo": "nivel_rio",
      "nivel": "critico",
      "mensagem": "Nível do rio acima da cota de transbordo (4.5m).",
      "data_emissao": "2026-08-23T20:15:00Z",
      "status": "ativo"
    }
  ],
  "meta": {
    "total": 2
  }
}
```

### 1.2 Detalhes da Estação
- **Rota**: `GET /api/v1/estacoes/{id}`
- **Descrição**: Retorna os detalhes e o estado atual de uma estação de monitoramento específica, incluindo sua última leitura.
- **Exemplo de Resposta (200 OK)**:
```json
{
  "data": {
    "id": "ST-001",
    "nome": "Estação Centro",
    "localizacao": {
      "latitude": -8.047562,
      "longitude": -34.877002
    },
    "tipo": "pluviometrica",
    "status": "operacional",
    "ultima_leitura": {
      "data_hora": "2026-08-23T21:00:00Z",
      "precipitacao_mm": 12.5,
      "temperatura_c": 26.2,
      "umidade_relativa": 85
    }
  }
}
```

---

## 2. Previsão do Tempo (Watch)

### 2.1 Previsão Atual e Curto Prazo
- **Rota**: `GET /api/v1/watch/previsao`
- **Descrição**: Retorna a previsão meteorológica (curto e médio prazo) baseada em uma localização específica, permitindo exibir dados de tempo esperado no dashboard.
- **Parâmetros de Query**:
  - `lat` (float): Latitude.
  - `lon` (float): Longitude.
  - `dias` (int): Quantidade de dias para a previsão (padrão: 3).
- **Exemplo de Resposta (200 OK)**:
```json
{
  "data": {
    "localizacao": {
      "cidade": "Recife",
      "estado": "PE",
      "pais": "BR"
    },
    "previsao": [
      {
        "data": "2026-08-23",
        "condicao": "chuva_moderada",
        "temperatura_min": 24.5,
        "temperatura_max": 28.0,
        "probabilidade_chuva": 80,
        "volume_chuva_mm": 15.0
      },
      {
        "data": "2026-08-24",
        "condicao": "chuva_forte",
        "temperatura_min": 23.0,
        "temperatura_max": 26.5,
        "probabilidade_chuva": 95,
        "volume_chuva_mm": 45.0
      }
    ]
  }
}
```

### 2.2 Alertas Meteorológicos Externos
- **Rota**: `GET /api/v1/watch/alertas-climaticos`
- **Descrição**: Integra com APIs externas de meteorologia e órgãos oficiais (ex: INMET, Defesa Civil) e retorna alertas emitidos para a região monitorada.
- **Exemplo de Resposta (200 OK)**:
```json
{
  "data": [
    {
      "orgao_emissor": "INMET",
      "severidade": "perigo_potencial",
      "tipo_alerta": "Chuvas Intensas",
      "descricao": "Chuva entre 20 e 30 mm/h ou até 50 mm/dia, ventos intensos (40-60 km/h).",
      "inicio": "2026-08-23T10:00:00Z",
      "fim": "2026-08-24T10:00:00Z",
      "link_oficial": "https://alertas.inmet.gov.br/123"
    }
  ],
  "meta": {
    "ultima_atualizacao": "2026-08-23T21:00:00Z"
  }
}
```

---

## 3. Séries Temporais e Estatísticas (Vigil)

### 3.1 Histórico de Leituras (Série Temporal)
- **Rota**: `GET /api/v1/vigil/estacoes/{id}/historico`
- **Descrição**: Retorna a série temporal de leituras de sensores de uma estação específica. Utilizado principalmente para a plotagem de gráficos de evolução (ex: volume de chuva ao longo do tempo).
- **Parâmetros de Query**:
  - `data_inicio` (ISO 8601): Data e hora inicial do filtro.
  - `data_fim` (ISO 8601): Data e hora final do filtro.
  - `agrupamento` (string): Agrupamento dos dados retornado (ex: `hora`, `dia`).
- **Exemplo de Resposta (200 OK)**:
```json
{
  "data": [
    {
      "timestamp": "2026-08-23T10:00:00Z",
      "precipitacao_mm": 2.5,
      "nivel_rio_m": 1.2
    },
    {
      "timestamp": "2026-08-23T11:00:00Z",
      "precipitacao_mm": 5.0,
      "nivel_rio_m": 1.4
    }
  ],
  "meta": {
    "estacao_id": "ST-001",
    "agrupamento": "hora",
    "total_registros": 2
  }
}
```

### 3.2 Estatísticas e Consolidado
- **Rota**: `GET /api/v1/vigil/estacoes/{id}/estatisticas`
- **Descrição**: Retorna métricas estatísticas consolidadas da estação (ex: índice máximo, mínimo, média de precipitação/nível, acumulado).
- **Parâmetros de Query**:
  - `periodo` (string): Recorte de tempo a analisar (ex: `24h`, `7d`, `30d`).
- **Exemplo de Resposta (200 OK)**:
```json
{
  "data": {
    "precipitacao": {
      "acumulado_mm": 45.5,
      "maxima_mm_h": 12.0,
      "media_mm_h": 1.9
    },
    "nivel_rio": {
      "maximo_m": 2.8,
      "minimo_m": 1.1,
      "media_m": 1.5
    }
  },
  "meta": {
    "estacao_id": "ST-001",
    "periodo": "24h"
  }
}
```

---

## 4. Reports (Relatos da Comunidade / Agentes)

### 4.1 Enviar Novo Report
- **Rota**: `POST /api/v1/reports`
- **Descrição**: Rota para criação de um novo relato de ocorrência (ex: alagamento, deslizamento de barreira, queda de árvore) vindo de usuários ou agentes de campo.
- **Exemplo de Corpo da Requisição (Payload JSON)**:
```json
{
  "tipo": "alagamento",
  "descricao": "Rua totalmente intransitável, água cobrindo a calçada.",
  "localizacao": {
    "latitude": -8.051234,
    "longitude": -34.882345,
    "endereco": "Av. Agamenon Magalhães, próximo ao viaduto"
  },
  "midia_url": [
    "https://storage.exemplo.com/reports/img-001.jpg"
  ]
}
```

### 4.2 Listar Reports
- **Rota**: `GET /api/v1/reports`
- **Descrição**: Retorna a lista de relatos enviados, útil para mapeamento e gestão de ocorrências em tempo real.
- **Parâmetros de Query** (Opcionais):
  - `status` (string): Filtra o estado do report (ex: `pendente`, `verificado`, `descartado`).
  - `tipo` (string): Filtra por categoria de ocorrência (ex: `alagamento`, `deslizamento`).
  - `lat`, `lon`, `raio_km`: Para buscas baseadas em geolocalização.
