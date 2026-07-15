{{
  config(
    materialized = 'table',
    schema = 'silver',
    tags = ['api', 'cemaden', 'silver']
  )
}}

WITH dedup_data AS (
  -- Deduplica registros idênticos por estação e data_hora (mantendo o mais recente)
  SELECT
    codigo_gmmc,
    data_hora,
    chuva,
    tipo AS tipo_estacao,
    uf,
    ingestao_ts,
    ROW_NUMBER() OVER (
      PARTITION BY codigo_gmmc, data_hora
      ORDER BY ingestao_ts DESC
    ) AS rn
  FROM {{ ref('brz_api_cemaden') }}
)

SELECT
  d.codigo_gmmc AS estacao_codigo,
  e.nome_estacao,
  e.municipio_nome,
  e.codigo_ibge,
  d.data_hora,
  d.chuva,
  e.latitude,
  e.longitude,
  d.tipo_estacao,
  d.uf,
  d.ingestao_ts
FROM dedup_data d
LEFT JOIN {{ ref('mapeamento_estacoes') }} e
  ON d.codigo_gmmc = e.estacao_codigo
WHERE d.rn = 1
