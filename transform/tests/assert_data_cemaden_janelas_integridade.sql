SELECT
  estacao_codigo,
  data_hora,
  chuva_15min,
  chuva_1h,
  chuva_3h,
  chuva_6h,
  chuva_12h,
  chuva_24h
FROM {{ ref('data_cemaden_acumulados') }}
WHERE
  chuva_15min IS NOT NULL
  AND chuva_1h   IS NOT NULL
  AND chuva_3h   IS NOT NULL
  AND chuva_6h   IS NOT NULL
  AND chuva_12h  IS NOT NULL
  AND chuva_24h  IS NOT NULL
  AND NOT (
    chuva_1h  >= chuva_15min
    AND chuva_3h  >= chuva_1h
    AND chuva_6h  >= chuva_3h
    AND chuva_12h >= chuva_6h
    AND chuva_24h >= chuva_12h
  )
