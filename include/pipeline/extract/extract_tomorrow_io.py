"""
extract_tomorrow_io.py
──────────────────────────────────────────────────────────────────────────────
Extrator para a Tomorrow.io API (Nowcasting — minuto a minuto).

Fonte   : Tomorrow.io API — https://www.tomorrow.io/
Docs    : https://docs.tomorrow.io/reference/realtime-weather
Bucket  : s3://tomorrow-api/
Partição: Hive — ano=YYYY/mes=MM/dia=DD/HH-MM.parquet
Região  : RMR (Região Metropolitana do Recife) — lat=-8.05, lon=-34.88
Auth    : Requer TOMORROW_IO_API_KEY (variável de ambiente no .env)
          ⚠️  API key ainda não criada — criar em: https://app.tomorrow.io/

Frequência prevista: a cada 15 minutos (mesma cadência do CEMADEN)
DAG prevista: dag_tomorrow_io.py (a criar — próxima fase)

Campos coletados (fields):
    precipitationIntensity      → Intensidade da chuva (mm/h)
    precipitationProbability    → Probabilidade de precipitação (%)
    temperature                 → Temperatura (°C)
    windSpeed                   → Velocidade do vento (m/s)
    windDirection               → Direção do vento (graus)
    humidity                    → Umidade relativa (%)

Exemplo de endpoint:
    GET https://api.tomorrow.io/v4/timelines
        ?location=-8.05,-34.88
        &fields=precipitationIntensity,precipitationProbability,temperature,windSpeed,windDirection,humidity
        &timesteps=1m
        &apikey=${TOMORROW_IO_API_KEY}

TODO (próxima fase — após criação da API key e testes MinIO):
    [ ] Criar conta e API key em app.tomorrow.io
    [ ] Adicionar TOMORROW_IO_API_KEY ao .env
    [ ] Implementar fetch_data() com autenticação via query param ?apikey=
    [ ] Implementar save_to_minio() com partição por hora (HH-MM.parquet)
    [ ] Implementar run_pipeline()
    [ ] Criar dag_tomorrow_io.py (schedule: */15 * * * *)
    [ ] Definir lista completa de fields a coletar
"""

import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from config.settings import MINIO_ENDPOINT  # noqa: F401 — importado para validação de ambiente

# ─── Configuração ─────────────────────────────────────────────────────────────
BASE_URL   = "https://api.tomorrow.io/v4/timelines"
BUCKET     = "tomorrow-api"
API_KEY_ENV = "TOMORROW_IO_API_KEY"  # Nome da variável de ambiente

LOCATION = "-8.05,-34.88"  # RMR — Recife

FIELDS = [
    "precipitationIntensity",
    "precipitationProbability",
    "temperature",
    "windSpeed",
    "windDirection",
    "humidity",
]


# ─── Interface (a implementar) ────────────────────────────────────────────────

def fetch_data():
    """
    Busca dados de nowcasting da Tomorrow.io API.

    Requer: TOMORROW_IO_API_KEY definida no ambiente.

    Returns:
        pd.DataFrame: Leituras minuto a minuto para a RMR.
    """
    raise NotImplementedError(
        "fetch_data() aguarda implementação — Requer API key Tomorrow.io"
    )


def save_to_minio(df):
    """
    Faz upload do DataFrame como Parquet para o bucket MinIO
    com Hive partitioning (ano=YYYY/mes=MM/dia=DD/HH-MM.parquet).

    Args:
        df: DataFrame retornado por fetch_data().
    """
    raise NotImplementedError(
        "save_to_minio() aguarda implementação — Requer API key Tomorrow.io"
    )


def run_pipeline():
    """Função principal: fetch → save. Chamada pelo Airflow ou execução local."""
    raise NotImplementedError(
        "run_pipeline() aguarda implementação — Requer API key Tomorrow.io"
    )


if __name__ == "__main__":
    run_pipeline()
