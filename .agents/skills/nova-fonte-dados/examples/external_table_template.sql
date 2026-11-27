-- Template de tabela externa Bronze (Parquet particionado Hive no GCS)
-- Substitua <fonte> e <entidade>. Se houver subpasta (ex.: current/), inclua no uri e no prefix.
CREATE OR REPLACE EXTERNAL TABLE `nimbus-506613.nimbus_bronze_prod.<fonte>_<entidade>`
WITH PARTITION COLUMNS (
  ano INT64,
  mes INT64,
  dia INT64
)
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://nimbus-506613-bronze-<fonte>/ano=*'],
  hive_partition_uri_prefix = 'gs://nimbus-506613-bronze-<fonte>/',
  description = '<Descrição da fonte> (bruta)'
);
