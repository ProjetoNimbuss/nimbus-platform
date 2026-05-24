{{
  config(
    materialized = 'table',
    schema = 'gold',
    tags = ['gold', 'ranking', 'extremos']
  )
}}

/*
  Ranking de eventos extremos de precipitação diária.
  Inclui apenas registros com precipitação medida (precipitacao_mm > 0),
  pois apenas esses fazem sentido para classificação de eventos.
  
  PERCENT_RANK: 0 = mínimo histórico da estação, 1 = máximo absoluto.
*/

WITH eventos AS (
  SELECT
    codigo_estacao,
    nome_estacao,
    municipio,
    mesorregiao,
    mesorregiao_id,
    data,
    ano,
    mes,
    dia,
    precipitacao_mm,
    alerta_chuva,
    periodo_clima
  FROM {{ ref('monitoramento_pluviometrico') }}
  WHERE precipitacao_mm > 0   -- apenas dias com chuva registrada
),

com_ranking AS (
  SELECT
    *,
    -- Percentil dentro de toda a série histórica da estação
    {{ percentile_rank('precipitacao_mm', 'codigo_estacao') }}   AS percentil_estacao,
    -- Percentil dentro da mesorregião
    {{ percentile_rank('precipitacao_mm', 'mesorregiao_id') }}   AS percentil_mesorregiao,
    -- Rank absoluto (1 = evento mais intenso) por estação
    ROW_NUMBER() OVER (
      PARTITION BY codigo_estacao
      ORDER BY precipitacao_mm DESC
    )                                                             AS rank_estacao
  FROM eventos
)

SELECT
  codigo_estacao,
  nome_estacao,
  municipio,
  mesorregiao,
  mesorregiao_id,
  data,
  ano,
  mes,
  dia,
  precipitacao_mm,
  alerta_chuva,
  periodo_clima,
  ROUND(percentil_estacao * 100, 2)    AS percentil_estacao,
  ROUND(percentil_mesorregiao * 100, 2) AS percentil_mesorregiao,
  rank_estacao,
  -- Classificação de severidade pelo percentil
  CASE
    WHEN percentil_estacao >= 0.99 THEN 'Evento Histórico (top 1%)'
    WHEN percentil_estacao >= 0.95 THEN 'Muito Extremo (top 5%)'
    WHEN percentil_estacao >= 0.90 THEN 'Extremo (top 10%)'
    WHEN percentil_estacao >= 0.75 THEN 'Severo (top 25%)'
    ELSE 'Significativo'
  END                                   AS severidade
FROM com_ranking
