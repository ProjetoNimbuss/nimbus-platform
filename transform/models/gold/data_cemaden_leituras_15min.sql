{{
  config(
    materialized = 'incremental',
    unique_key = ['estacao_codigo', 'data_hora'],
    schema = 'gold',
    tags = ['api', 'cemaden', 'gold']
  )
}}

SELECT
  f.estacao_codigo,
  e.nome_estacao,
  e.municipio_nome AS municipio,
  e.latitude,
  e.longitude,
  e.codigo_ibge,
  f.data_hora,
  f.chuva,
  f.tipo_estacao,
  f.uf,
  f.ingestao_ts
FROM {{ ref('data_cemaden_silver') }} f
LEFT JOIN {{ ref('mapeamento_estacoes') }} e
  ON f.estacao_codigo = e.estacao_codigo

{% if is_incremental() %}
  WHERE f.data_hora >= (
    SELECT COALESCE(MAX(data_hora), '1970-01-01'::timestamp) - INTERVAL '24 hours'
    FROM {{ this }}
  )
{% endif %}

ORDER BY estacao_codigo, data_hora
