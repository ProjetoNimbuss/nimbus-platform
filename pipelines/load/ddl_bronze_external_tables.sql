CREATE OR REPLACE EXTERNAL TABLE `nimbus-506613.nimbus_bronze_prod.cemaden_telemetria`
WITH PARTITION COLUMNS (
  ano INT64,
  mes INT64,
  dia INT64
)
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://nimbus-506613-bronze-cemaden/ano=*'],
  hive_partition_uri_prefix = 'gs://nimbus-506613-bronze-cemaden/',
  description = 'Telemetria de estações pluviométricas automáticas CEMADEN (bruta)'
);


CREATE OR REPLACE EXTERNAL TABLE `nimbus-506613.nimbus_bronze_prod.open_meteo_weather_current`
WITH PARTITION COLUMNS (
  uf STRING,
  ano INT64,
  mes INT64,
  dia INT64
)
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://nimbus-506613-bronze-open-meteo-weather/current/uf=*'],
  hive_partition_uri_prefix = 'gs://nimbus-506613-bronze-open-meteo-weather/current/',
  description = 'Condições meteorológicas terrestres atuais Open-Meteo'
);

CREATE OR REPLACE EXTERNAL TABLE `nimbus-506613.nimbus_bronze_prod.open_meteo_weather_hourly`
WITH PARTITION COLUMNS (
  uf STRING,
  data_extracao DATE
)
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://nimbus-506613-bronze-open-meteo-weather/forecast_hourly/uf=*'],
  hive_partition_uri_prefix = 'gs://nimbus-506613-bronze-open-meteo-weather/forecast_hourly/',
  description = 'Previsão meteorológica horária terrestre de 7 dias da Open-Meteo'
);

CREATE OR REPLACE EXTERNAL TABLE `nimbus-506613.nimbus_bronze_prod.open_meteo_weather_daily`
WITH PARTITION COLUMNS (
  uf STRING,
  data_extracao DATE
)
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://nimbus-506613-bronze-open-meteo-weather/forecast_daily/uf=*'],
  hive_partition_uri_prefix = 'gs://nimbus-506613-bronze-open-meteo-weather/forecast_daily/',
  description = 'Previsão meteorológica diária agregada de 7 dias da Open-Meteo'
);


CREATE OR REPLACE EXTERNAL TABLE `nimbus-506613.nimbus_bronze_prod.open_meteo_marine_current`
WITH PARTITION COLUMNS (
  uf STRING,
  ano INT64,
  mes INT64,
  dia INT64
)
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://nimbus-506613-bronze-open-meteo-marine/current/uf=*'],
  hive_partition_uri_prefix = 'gs://nimbus-506613-bronze-open-meteo-marine/current/',
  description = 'Condições marítimas e de ondas atuais em pontos costeiros'
);

CREATE OR REPLACE EXTERNAL TABLE `nimbus-506613.nimbus_bronze_prod.open_meteo_marine_hourly`
WITH PARTITION COLUMNS (
  uf STRING,
  data_extracao DATE
)
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://nimbus-506613-bronze-open-meteo-marine/forecast_hourly/uf=*'],
  hive_partition_uri_prefix = 'gs://nimbus-506613-bronze-open-meteo-marine/forecast_hourly/',
  description = 'Previsão horária de ondas, maré e correntes para pontos costeiros'
);

CREATE OR REPLACE EXTERNAL TABLE `nimbus-506613.nimbus_bronze_prod.open_meteo_marine_daily`
WITH PARTITION COLUMNS (
  uf STRING,
  data_extracao DATE
)
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://nimbus-506613-bronze-open-meteo-marine/forecast_daily/uf=*'],
  hive_partition_uri_prefix = 'gs://nimbus-506613-bronze-open-meteo-marine/forecast_daily/',
  description = 'Previsão diária de ondas (altura máxima, direção dominante) para pontos costeiros'
);


CREATE OR REPLACE EXTERNAL TABLE `nimbus-506613.nimbus_bronze_prod.tomorrow_hourly_forecast` (
  time STRING,
  polo STRING,
  cidade_base STRING,
  latitude_consulta FLOAT64,
  longitude_consulta FLOAT64,
  origem_api STRING,
  ingestion_timestamp_utc STRING,
  rainIntensity FLOAT64,
  precipitationProbability INT64,
  temperature FLOAT64,
  temperatureApparent FLOAT64,
  windSpeed FLOAT64,
  windDirection INT64,
  humidity INT64,
  visibility FLOAT64,
  weatherCode INT64
)
WITH PARTITION COLUMNS (
  uf STRING,
  data_ingestao DATE
)
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://nimbus-506613-bronze-tomorrow-api/hourly_forecast/uf=*'],
  hive_partition_uri_prefix = 'gs://nimbus-506613-bronze-tomorrow-api/hourly_forecast/',
  description = 'Previsão nowcasting horária de alta resolução para pólos sentinela da RMR'
);


CREATE OR REPLACE EXTERNAL TABLE `nimbus-506613.nimbus_bronze_prod.apac_historico` (
  codigo INT64,
  posto STRING,
  mes_ano STRING,
  mesorregiao_id INT64,
  ano_ref INT64,
  dia_01 STRING, dia_02 STRING, dia_03 STRING, dia_04 STRING, dia_05 STRING,
  dia_06 STRING, dia_07 STRING, dia_08 STRING, dia_09 STRING, dia_10 STRING,
  dia_11 STRING, dia_12 STRING, dia_13 STRING, dia_14 STRING, dia_15 STRING,
  dia_16 STRING, dia_17 STRING, dia_18 STRING, dia_19 STRING, dia_20 STRING,
  dia_21 STRING, dia_22 STRING, dia_23 STRING, dia_24 STRING, dia_25 STRING,
  dia_26 STRING, dia_27 STRING, dia_28 STRING, dia_29 STRING, dia_30 STRING, dia_31 STRING
)
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://nimbus-506613-bronze-apac/*.parquet'],
  description = 'Série histórica de monitoramento pluviométrico mensal APAC PE desde 1961'
);


CREATE OR REPLACE EXTERNAL TABLE `nimbus-506613.nimbus_bronze_prod.ibge_municipios_pe`
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://nimbus-506613-geo-complementares/municipios_pe_geo.parquet'],
  description = 'Relação de municípios de Pernambuco com códigos IBGE e centróides geográficos'
);
