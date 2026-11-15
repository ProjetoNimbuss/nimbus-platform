/**
 * Declaração das fontes externas da Camada Bronze (GCS -> BigQuery).
 * Permite que os modelos das camadas Silver e Gold referenciem estas tabelas
 * diretamente através de `${ref("nome_da_tabela")}`.
 */

const bronzeTables = [
  "cemaden_telemetria",
  "open_meteo_weather_current",
  "open_meteo_weather_hourly",
  "open_meteo_weather_daily",
  "open_meteo_marine_current",
  "open_meteo_marine_hourly",
  "open_meteo_marine_daily",
  "tomorrow_hourly_forecast",
  "apac_historico",
  "ibge_municipios_pe"
];

bronzeTables.forEach((tableName) => {
  declare({
    database: "nimbus-506613",
    schema: "nimbus_bronze_prod",
    name: tableName,
    description: `Tabela externa da camada Bronze apontando para os dados brutos no GCS: ${tableName}`
  });
});
