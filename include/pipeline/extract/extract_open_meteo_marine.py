"""
extract_open_meteo_marine.py
──────────────────────────────────────────────────────────────────────────────
Extrator para a Open-Meteo Marine API.

Fonte   : Open-Meteo Marine API — https://open-meteo.com/
Docs    : https://open-meteo.com/en/docs/marine-weather-api
Bucket  : s3://open-meteo-marine/
Partição: Hive — ano=YYYY/mes=MM/dia=DD/marine.parquet
Região  : Costa de Pernambuco / Porto do Recife: lat=-8.05, lon=-34.87
Auth    : Não requer API key

Campos coletados (hourly):
    wave_height             → Altura significativa das ondas (m)
    wave_direction          → Direção das ondas (graus)
    wave_period             → Período das ondas (s)
    ocean_current_velocity  → Velocidade da corrente oceânica (m/s)

Exemplo de endpoint:
    GET https://marine-api.open-meteo.com/v1/marine
        ?latitude=-8.05
        &longitude=-34.87
        &hourly=wave_height,wave_direction,wave_period,ocean_current_velocity
        &timezone=America/Recife

TODO (próxima fase — após testes MinIO):
    [ ] Implementar fetch_data() → requests.get + pd.json_normalize
    [ ] Implementar save_to_minio() → upload Parquet com Hive partitioning
    [ ] Implementar run_pipeline() → orquestra fetch + save
    [ ] Avaliar pontos adicionais de coleta (ilhas de PE: Fernando de Noronha)
    [ ] Adicionar ao dag_open_meteo.py junto com o Weather
"""

import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from config.settings import MINIO_ENDPOINT  # noqa: F401 — importado para validação de ambiente

# ─── Configuração ─────────────────────────────────────────────────────────────
BASE_URL = "https://marine-api.open-meteo.com/v1/marine"
BUCKET   = "open-meteo-marine"

PARAMS = {
    "latitude":  -8.05,
    "longitude": -34.87,
    "hourly":    "wave_height,wave_direction,wave_period,ocean_current_velocity",
    "timezone":  "America/Recife",
    "forecast_days": 7,
}


# ─── Interface (a implementar) ────────────────────────────────────────────────

def fetch_data():
    """
    Busca dados da Open-Meteo Marine API.

    Returns:
        pd.DataFrame: Série horária com altura, direção, período de ondas e correntes.
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
