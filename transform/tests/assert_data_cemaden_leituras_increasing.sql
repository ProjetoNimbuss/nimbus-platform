WITH ordenado AS (
  SELECT
    estacao_codigo,
    data_hora,
    LAG(data_hora) OVER (
      PARTITION BY estacao_codigo
      ORDER BY data_hora
    ) AS data_hora_anterior
  FROM {{ ref('data_cemaden_leituras_15min') }}
)

SELECT *
FROM ordenado
WHERE data_hora_anterior IS NOT NULL
  AND data_hora <= data_hora_anterior
