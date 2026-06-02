{{
  config(
    materialized = 'table',
    schema = 'gold',
    tags = ['gold', 'qualidade', 'daily']
  )
}}

/*
  Perfil de qualidade de dados por estação pluviométrica.
  Computado sobre todo o histórico disponível (1961 até hoje).
  
  score_confianca = registros_validos / total_registros
  - >= 0.90 → 'alta'    (estacao_confiavel = true)
  - >= 0.70 → 'media'
  -  < 0.70 → 'baixa'
  
*/

WITH base AS (
  SELECT
    codigo_estacao,
    nome_estacao,
    municipio,
    mesorregiao,
    data,
    precipitacao_mm
  FROM {{ ref('monitoramento_pluviometrico') }}
),

medicoes_por_estacao AS (
  SELECT
    codigo_estacao,
    COUNT(*)                          AS total_registros,
    COUNT(precipitacao_mm)            AS registros_validos,
    COUNT(*) - COUNT(precipitacao_mm) AS registros_nulos,
    MIN(data)                         AS data_inicio,
    MAX(data)                         AS data_fim
  FROM base
  GROUP BY codigo_estacao
),

metadados AS (
  SELECT DISTINCT
    codigo_estacao,
    FIRST_VALUE(nome_estacao) OVER (
      PARTITION BY codigo_estacao ORDER BY data DESC
    ) AS nome_estacao,
    FIRST_VALUE(municipio) OVER (
      PARTITION BY codigo_estacao ORDER BY data DESC
    ) AS municipio,
    FIRST_VALUE(mesorregiao) OVER (
      PARTITION BY codigo_estacao ORDER BY data DESC
    ) AS mesorregiao
  FROM base
),

qualidade AS (
  SELECT
    m.codigo_estacao,
    meta.nome_estacao,
    meta.municipio,
    meta.mesorregiao,
    m.data_inicio,
    m.data_fim,
    DATE_DIFF('year', m.data_inicio, m.data_fim)                                   AS anos_cobertura,
    m.total_registros,
    m.registros_validos,
    m.registros_nulos,
    ROUND(100.0 * m.registros_validos / NULLIF(m.total_registros, 0), 2)           AS pct_preenchimento,
    ROUND(100.0 * m.registros_nulos   / NULLIF(m.total_registros, 0), 2)           AS pct_nulos,
    ROUND(m.registros_validos::DOUBLE / NULLIF(m.total_registros, 0), 4)           AS score_confianca
  FROM medicoes_por_estacao m
  LEFT JOIN metadados meta USING (codigo_estacao)
)

SELECT
  codigo_estacao,
  nome_estacao,
  municipio,
  mesorregiao,
  data_inicio,
  data_fim,
  anos_cobertura,
  total_registros,
  registros_validos,
  registros_nulos,
  pct_preenchimento,
  pct_nulos,
  score_confianca,
  CASE
    WHEN score_confianca >= 0.90 THEN 'alta'
    WHEN score_confianca >= 0.70 THEN 'media'
    ELSE                               'baixa'
  END                         AS categoria_qualidade,
  score_confianca >= 0.90     AS estacao_confiavel,
  CURRENT_TIMESTAMP           AS atualizado_em
FROM qualidade
ORDER BY score_confianca ASC
