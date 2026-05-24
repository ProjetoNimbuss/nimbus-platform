{{
  config(
    materialized = 'table',
    schema = 'gold',
    tags = ['gold', 'agregados', 'anuais']
  )
}}

WITH totais_anuais AS (
  SELECT
    codigo_estacao,
    nome_estacao,
    municipio,
    mesorregiao,
    mesorregiao_id,
    latitude,
    longitude,
    ano,
    -- Total precipitado no ano
    SUM(precipitacao_mm)                        AS total_anual_mm,
    -- Dias com chuva registrada (precipitacao_mm > 0)
    COUNT(CASE WHEN precipitacao_mm > 0 THEN 1 END) AS dias_com_chuva,
    -- Dias sem chuva (precipitacao_mm = 0 ou NULL)
    COUNT(CASE WHEN COALESCE(precipitacao_mm, 0) = 0 THEN 1 END) AS dias_sem_chuva,
    -- Precipitação máxima diária do ano
    MAX(precipitacao_mm)                        AS max_diario_mm,
    -- Média mensal (total / 12 meses)
    SUM(precipitacao_mm) / 12.0                 AS media_mensal_mm
  FROM {{ ref('monitoramento_pluviometrico') }}
  WHERE ano IS NOT NULL
  GROUP BY
    codigo_estacao, nome_estacao, municipio,
    mesorregiao, mesorregiao_id,
    latitude, longitude, ano
),

media_historica AS (
  SELECT
    codigo_estacao,
    -- Média histórica do total anual por estação
    AVG(total_anual_mm) OVER (PARTITION BY codigo_estacao) AS media_historica_anual_mm,
    -- Desvio padrão histórico por estação (para identificar anomalias)
    STDDEV(total_anual_mm) OVER (PARTITION BY codigo_estacao) AS stddev_historico_mm
  FROM totais_anuais
)

SELECT
  t.codigo_estacao,
  t.nome_estacao,
  t.municipio,
  t.mesorregiao,
  t.mesorregiao_id,
  t.latitude,
  t.longitude,
  t.ano,
  t.total_anual_mm,
  t.dias_com_chuva,
  t.dias_sem_chuva,
  t.max_diario_mm,
  ROUND(t.media_mensal_mm, 2)                                                 AS media_mensal_mm,
  ROUND(h.media_historica_anual_mm, 2)                                        AS media_historica_anual_mm,
  ROUND(h.stddev_historico_mm, 2)                                             AS stddev_historico_mm,
  -- Desvio absoluto do ano em relação à média histórica
  ROUND(t.total_anual_mm - h.media_historica_anual_mm, 2)                     AS desvio_historico_mm,
  -- Desvio relativo em %
  ROUND(
    (t.total_anual_mm - h.media_historica_anual_mm) / NULLIF(h.media_historica_anual_mm, 0) * 100,
    1
  )                                                                            AS desvio_historico_pct,
  -- Percentil do ano dentro da série histórica da estação
  ROUND({{ percentile_rank('t.total_anual_mm', 't.codigo_estacao') }} * 100, 1) AS percentil_anual,
  -- Classificação do ano: Seco / Normal / Chuvoso
  CASE
    WHEN t.total_anual_mm < h.media_historica_anual_mm - h.stddev_historico_mm THEN 'Ano Seco'
    WHEN t.total_anual_mm > h.media_historica_anual_mm + h.stddev_historico_mm THEN 'Ano Chuvoso'
    ELSE 'Ano Normal'
  END                                                                          AS classificacao_ano
FROM totais_anuais t
JOIN media_historica h USING (codigo_estacao)
  QUALIFY ROW_NUMBER() OVER (PARTITION BY t.codigo_estacao, t.ano ORDER BY t.codigo_estacao) = 1
