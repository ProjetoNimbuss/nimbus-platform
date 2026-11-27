"""
Template de extractor Nimbus.
Substitua <fonte>/<FONTE> e ajuste COL_MAP, NUMERIC_COLS, STRING_COLS e COLS.
"""

import os
import sys
from datetime import datetime

import pandas as pd
import requests

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from pipelines.config.settings import FONTE_URL  # noqa: E402  -> criar em settings.py
from pipelines.storage.gcs import save_dataframe_to_gcs  # noqa: E402

BUCKET_KEY = "fonte"  # chave em settings.BUCKETS

COL_MAP = {
    "DataHora": "data_hora",
    "CodEstacao": "codigo_estacao",
    "Chuva": "chuva_mm",
}
NUMERIC_COLS = ["chuva_mm"]
STRING_COLS = ["codigo_estacao"]
COLS = ["data_hora", "codigo_estacao", "chuva_mm", "ingestao_ts"]


def fetch_data() -> pd.DataFrame:
    """Busca dados da fonte e retorna DataFrame normalizado e tipado."""
    response = requests.get(FONTE_URL, timeout=30)
    response.raise_for_status()

    df = pd.DataFrame(response.json())
    if df.empty:
        return df

    df = df.rename(columns=COL_MAP)
    df["data_hora"] = pd.to_datetime(df["data_hora"], errors="coerce")

    # Tipagem explícita: tipos mistos quebram o Parquet / tabela externa
    for col in NUMERIC_COLS:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    for col in STRING_COLS:
        df[col] = df[col].astype(str)

    df["ingestao_ts"] = datetime.now()
    return df[COLS]


def save_partitioned(df: pd.DataFrame) -> str:
    """Salva o DataFrame em Parquet particionado (ano/mes/dia) no GCS."""
    if df.empty:
        print("[FONTE] DataFrame vazio. Nenhum arquivo salvo.")
        return ""

    data_referencia = df["data_hora"].max()
    return save_dataframe_to_gcs(df, bucket_key=BUCKET_KEY, ref_date=data_referencia)


if __name__ == "__main__":
    dados = fetch_data()
    print(f"[FONTE] {len(dados)} registros obtidos.")
    print(f"[FONTE] Salvo em: {save_partitioned(dados)}")
