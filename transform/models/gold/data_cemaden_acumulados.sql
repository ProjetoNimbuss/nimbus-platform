{{
  config(
    materialized = 'incremental',
    unique_key = ['estacao_codigo', 'data_hora'],
    schema = 'gold',
    tags = ['api', 'cemaden', 'gold']
  )
}}

WITH base_data AS (
  SELECT
    estacao_codigo,
    nome_estacao,
    municipio,
    latitude,
    longitude,
    codigo_ibge,
    data_hora,
    chuva,
    tipo_estacao,
    uf,
    ingestao_ts
  FROM {{ ref('data_cemaden_leituras_15min') }}
  
  {% if is_incremental() %}
    WHERE data_hora >= (
      SELECT COALESCE(MAX(data_hora), '1970-01-01'::timestamp) - INTERVAL '24 hours' 
      FROM {{ this }}
    )
  {% endif %}
),

calculo_janelas AS (
  SELECT
    estacao_codigo,
    nome_estacao,
    municipio,
    latitude,
    longitude,
    codigo_ibge,
    data_hora,
    chuva AS chuva_15min,
    
    -- Janela de 1h 
    CASE 
      WHEN COUNT(chuva) OVER (
        PARTITION BY estacao_codigo 
        ORDER BY data_hora 
        ROWS BETWEEN 3 PRECEDING AND CURRENT ROW
      ) = 4 
      THEN SUM(chuva) OVER (
        PARTITION BY estacao_codigo 
        ORDER BY data_hora 
        ROWS BETWEEN 3 PRECEDING AND CURRENT ROW
      )
      ELSE NULL 
    END AS chuva_1h,

    -- Janela de 3h
    CASE 
      WHEN COUNT(chuva) OVER (
        PARTITION BY estacao_codigo 
        ORDER BY data_hora 
        ROWS BETWEEN 11 PRECEDING AND CURRENT ROW
      ) = 12 
      THEN SUM(chuva) OVER (
        PARTITION BY estacao_codigo 
        ORDER BY data_hora 
        ROWS BETWEEN 11 PRECEDING AND CURRENT ROW
      )
      ELSE NULL 
    END AS chuva_3h,

    -- Janela de 6h
    CASE 
      WHEN COUNT(chuva) OVER (
        PARTITION BY estacao_codigo 
        ORDER BY data_hora 
        ROWS BETWEEN 23 PRECEDING AND CURRENT ROW
      ) = 24 
      THEN SUM(chuva) OVER (
        PARTITION BY estacao_codigo 
        ORDER BY data_hora 
        ROWS BETWEEN 23 PRECEDING AND CURRENT ROW
      )
      ELSE NULL 
    END AS chuva_6h,

    -- Janela de 12h
    CASE 
      WHEN COUNT(chuva) OVER (
        PARTITION BY estacao_codigo 
        ORDER BY data_hora 
        ROWS BETWEEN 47 PRECEDING AND CURRENT ROW
      ) = 48 
      THEN SUM(chuva) OVER (
        PARTITION BY estacao_codigo 
        ORDER BY data_hora 
        ROWS BETWEEN 47 PRECEDING AND CURRENT ROW
      )
      ELSE NULL 
    END AS chuva_12h,

    -- Janela de 24h
    CASE 
      WHEN COUNT(chuva) OVER (
        PARTITION BY estacao_codigo 
        ORDER BY data_hora 
        ROWS BETWEEN 95 PRECEDING AND CURRENT ROW
      ) = 96 
      THEN SUM(chuva) OVER (
        PARTITION BY estacao_codigo 
        ORDER BY data_hora 
        ROWS BETWEEN 95 PRECEDING AND CURRENT ROW
      )
      ELSE NULL 
    END AS chuva_24h,
    
    tipo_estacao,
    uf,
    ingestao_ts
  FROM base_data
)

SELECT * FROM calculo_janelas
ORDER BY estacao_codigo, data_hora
