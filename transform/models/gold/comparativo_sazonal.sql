{{
  config(
    materialized = 'view',
    schema = 'gold',
    tags = ['gold', 'sazonal', 'comparativo']
  )
}}

/*
  Comparativo sazonal: ano corrente vs média dos últimos 5 anos completos.
  Usa CURRENT_DATE para nunca ter o ano hardcoded.
  Agrupado por (mes, mesorregiao) para análise regional mensal.
*/

WITH ano_atual AS (
  SELECT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER AS ano_ref
),

base AS (
  SELECT
    mes,
    mesorregiao,
    mesorregiao_id,
    ano,
    SUM(precipitacao_mm)   AS total_mensal_mm,
    COUNT(DISTINCT data)   AS dias_com_dados
  FROM {{ ref('monitoramento_pluviometrico') }}
  WHERE precipitacao_mm IS NOT NULL
  GROUP BY mes, mesorregiao, mesorregiao_id, ano
),

-- Dados do ano corrente
ano_corrente AS (
  SELECT
    b.mes,
    b.mesorregiao,
    b.mesorregiao_id,
    b.total_mensal_mm    AS precipitacao_ano_atual_mm,
    b.dias_com_dados     AS dias_ano_atual
  FROM base b
  CROSS JOIN ano_atual a
  WHERE b.ano = a.ano_ref
),

-- Média dos 5 anos completos anteriores ao ano corrente
ultimos_5_anos AS (
  SELECT
    b.mes,
    b.mesorregiao,
    b.mesorregiao_id,
    AVG(b.total_mensal_mm)            AS media_5anos_mm,
    STDDEV(b.total_mensal_mm)         AS stddev_5anos_mm,
    MIN(b.total_mensal_mm)            AS min_5anos_mm,
    MAX(b.total_mensal_mm)            AS max_5anos_mm,
    COUNT(DISTINCT b.ano)             AS anos_contabilizados
  FROM base b
  CROSS JOIN ano_atual a
  WHERE b.ano BETWEEN (a.ano_ref - 5) AND (a.ano_ref - 1)
  GROUP BY b.mes, b.mesorregiao, b.mesorregiao_id
)

SELECT
  (SELECT ano_ref FROM ano_atual)           AS ano_referencia,
  COALESCE(ac.mes, u5.mes)                  AS mes,
  COALESCE(ac.mesorregiao, u5.mesorregiao)  AS mesorregiao,
  COALESCE(ac.mesorregiao_id, u5.mesorregiao_id) AS mesorregiao_id,
  ac.precipitacao_ano_atual_mm,
  ac.dias_ano_atual,
  ROUND(u5.media_5anos_mm, 2)               AS media_5anos_mm,
  ROUND(u5.stddev_5anos_mm, 2)              AS stddev_5anos_mm,
  ROUND(u5.min_5anos_mm, 2)                 AS min_5anos_mm,
  ROUND(u5.max_5anos_mm, 2)                 AS max_5anos_mm,
  u5.anos_contabilizados,
  -- Desvio absoluto do ano atual em relação à média 5 anos
  ROUND(ac.precipitacao_ano_atual_mm - u5.media_5anos_mm, 2)  AS desvio_vs_media_5anos_mm,
  -- Desvio relativo %
  ROUND(
    (ac.precipitacao_ano_atual_mm - u5.media_5anos_mm)
    / NULLIF(u5.media_5anos_mm, 0) * 100, 1
  )                                          AS desvio_vs_media_5anos_pct,
  -- Posição do ano atual dentro do intervalo histórico
  CASE
    WHEN ac.precipitacao_ano_atual_mm IS NULL THEN 'Sem dados'
    WHEN ac.precipitacao_ano_atual_mm > u5.max_5anos_mm THEN 'Acima do máximo histórico'
    WHEN ac.precipitacao_ano_atual_mm < u5.min_5anos_mm THEN 'Abaixo do mínimo histórico'
    WHEN ac.precipitacao_ano_atual_mm > u5.media_5anos_mm + u5.stddev_5anos_mm THEN 'Acima da média'
    WHEN ac.precipitacao_ano_atual_mm < u5.media_5anos_mm - u5.stddev_5anos_mm THEN 'Abaixo da média'
    ELSE 'Dentro da normalidade'
  END                                        AS status_sazonal
FROM ultimos_5_anos u5
FULL OUTER JOIN ano_corrente ac
  ON  u5.mes            = ac.mes
  AND u5.mesorregiao_id = ac.mesorregiao_id
ORDER BY COALESCE(ac.mesorregiao, u5.mesorregiao), COALESCE(ac.mes, u5.mes)
