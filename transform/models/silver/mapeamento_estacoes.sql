{{
  config(
    materialized = 'table',
    schema = 'silver',
    tags = ['mapeamento', 'estacoes']
  )
}}

WITH fonte_api AS (
  -- Lê todos os arquivos Parquet da coleta de 15 minutos
  SELECT
    codigo_gmmc,
    cidade,
    nome_estacao,
    latitude,
    longitude,
    ROW_NUMBER() OVER (
      PARTITION BY codigo_gmmc
      ORDER BY data_hora DESC
    ) AS rn
  FROM {{ ref('brz_api_cemaden') }}
),

estacoes_dedup AS (
  SELECT
    codigo_gmmc,
    cidade,
    nome_estacao,
    latitude,
    longitude
  FROM fonte_api
  WHERE rn = 1
)

SELECT
  e.codigo_gmmc AS estacao_codigo,
  COALESCE(NULLIF(TRIM(e.nome_estacao), ''), 'Estação ' || e.codigo_gmmc) AS nome_estacao,
  COALESCE(NULLIF(UPPER(TRIM(e.cidade)), 'NAN'), UPPER(TRIM(ibge.municipio))) AS municipio_nome,
  ibge.codigo_ibge,
  CASE 
    WHEN e.latitude IS NULL OR isnan(e.latitude) THEN ibge.latitude 
    ELSE e.latitude 
  END AS latitude,
  CASE 
    WHEN e.longitude IS NULL OR isnan(e.longitude) THEN ibge.longitude 
    ELSE e.longitude 
  END AS longitude,
  CURRENT_TIMESTAMP AS atualizado_em
FROM estacoes_dedup e
LEFT JOIN {{ ref('stg_ibge_municipios_pe') }} ibge
  ON SUBSTR(e.codigo_gmmc, 1, 7) = CAST(ibge.codigo_ibge AS VARCHAR)