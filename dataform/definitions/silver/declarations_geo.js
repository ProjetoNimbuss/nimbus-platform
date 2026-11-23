/**
 * Declaração das tabelas estáticas e geográficas da Camada Silver
 * carregadas diretamente via script Python no BigQuery (nimbus_silver_prod).
 * Permite que a camada Gold faça referências nativas com ${ref("nome_da_tabela")}.
 */

const silverStaticTables = [
  "silver_geo_bairros_pe",
  "silver_reindesc_desastres",
  "silver_ibge_bairros_censo_pe",
  "silver_ibge_municipios_pe"
];

silverStaticTables.forEach((tableName) => {
  declare({
    database: "nimbus-506613",
    schema: "nimbus_silver_prod",
    name: tableName,
    description: `Tabela estática/geográfica normalizada na camada Silver: ${tableName}`
  });
});
