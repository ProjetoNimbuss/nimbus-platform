WITH intervalos AS (
  SELECT
    estacao_codigo,
    data_hora,
    LAG(data_hora) OVER (
      PARTITION BY estacao_codigo
      ORDER BY data_hora
    ) AS data_hora_anterior,
    DATEDIFF('minute',
      LAG(data_hora) OVER (PARTITION BY estacao_codigo ORDER BY data_hora),
      data_hora
    ) AS diferenca_minutos
  FROM {{ ref('data_cemaden_leituras_15min') }}
)

SELECT
  estacao_codigo,
  data_hora_anterior,
  data_hora,
  diferenca_minutos
FROM intervalos
WHERE data_hora_anterior IS NOT NULL
  AND diferenca_minutos != 15
