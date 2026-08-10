"""
extract_open_meteo_weather.py
──────────────────────────────────────────────────────────────────────────────
Extrator para a Open-Meteo Weather API.

Fonte   : Open-Meteo Weather API — https://open-meteo.com/
Docs    : https://open-meteo.com/en/docs
Bucket  : s3://open-meteo-weather/
Partição: Hive — ano=YYYY/mes=MM/dia=DD/forecast.parquet
Região  : Pernambuco — Recife: lat=-8.05, lon=-34.88
Auth    : Não requer API key

Campos coletados (hourly):
    temperature_2m          → Temperatura do ar a 2m (°C)
    relative_humidity_2m    → Umidade relativa a 2m (%)
    precipitation           → Precipitação total (mm)
    rain                    → Chuva (mm)
    wind_speed_10m          → Velocidade do vento a 10m (km/h)

Exemplo de endpoint:
    GET https://api.open-meteo.com/v1/forecast
        ?latitude=-8.05
        &longitude=-34.88
        &hourly=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m
        &timezone=America/Recife

Granularidade (a definir):
    - Opção A: Reextração diária completa dos 16 dias (idempotente, sobrescreve o parquet)
    - Opção B: Apenas delta (somente as horas futuras ainda não armazenadas)
    → DECISÃO PENDENTE antes da implementação

TODO (próxima fase — após testes MinIO):
    [ ] Implementar fetch_data() → requests.get + pd.json_normalize
    [ ] Implementar save_to_minio() → upload Parquet para bucket com Hive partitioning
    [ ] Implementar run_pipeline() → orquestra fetch + save
    [ ] Definir granularidade (idempotente vs. incremental)
    [ ] Adicionar DAG em dags/dag_open_meteo.py
"""

import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from config.settings import MINIO_ENDPOINT  # noqa: F401 — importado para validação de ambiente

# ─── Configuração ─────────────────────────────────────────────────────────────
BASE_URL = "https://api.open-meteo.com/v1/forecast"
BUCKET   = "open-meteo-weather"

PARAMS = {
    "latitude":  -8.05,
    "longitude": -34.88,
    "hourly":    "temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m",
    "timezone":  "America/Recife",
    "forecast_days": 16,
}


# ─── Interface (a implementar) ────────────────────────────────────────────────

def fetch_data():
    """
    Busca dados da Open-Meteo Weather API.

    Returns:
        pd.DataFrame: Série horária com temperatura, umidade, precipitação e vento.
    """
    raise NotImplementedError(
        "fetch_data() aguarda implementação — Fase: testes de integração MinIO"
    )


def save_to_minio(df):
    """
    Faz upload do DataFrame como Parquet para o bucket MinIO
    com Hive partitioning (ano=YYYY/mes=MM/dia=DD/).

    Args:
        df: DataFrame retornado por fetch_data().
    """
    raise NotImplementedError(
        "save_to_minio() aguarda implementação — Fase: testes de integração MinIO"
    )


def run_pipeline():
    """Função principal: fetch → save. Chamada pelo Airflow ou execução local."""
    raise NotImplementedError(
        "run_pipeline() aguarda implementação — Fase: testes de integração MinIO"
    )


if __name__ == "__main__":
    run_pipeline()
