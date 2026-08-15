import os
import sys
import json
import requests
import pandas as pd
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from config.settings import MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, BUCKETS
from pipeline.storage.duckdb_minio import get_duckdb_conn

COASTAL_POINTS = {
    "Recife - Boa Viagem": (-8.1200, -34.8800),
    "Porto do Recife": (-8.0550, -34.8600),
    "Olinda - Orla": (-7.9950, -34.8350),
    "Paulista - Maria Farinha": (-7.8600, -34.8200),
    "Ilha de Itamaracá": (-7.7450, -34.8100),
    "Jaboatão - Candeias": (-8.1800, -34.9000),
    "Cabo - Gaibu": (-8.3200, -34.9350),
    "Porto de Suape": (-8.3850, -34.9500),
    "Ipojuca - Porto de Galinhas": (-8.5100, -34.9800),
}

STORAGE_OPTIONS = {
    "key": MINIO_ACCESS_KEY,
    "secret": MINIO_SECRET_KEY,
    "client_kwargs": {"endpoint_url": MINIO_ENDPOINT}
}

def fetch_marine_current() -> pd.DataFrame:
    pontos = list(COASTAL_POINTS.keys())
    lats_tuple, lons_tuple = zip(*COASTAL_POINTS.values())

    lats = ",".join(map(str, lats_tuple))
    lons = ",".join(map(str, lons_tuple))

    params = {
        "latitude": lats,
        "longitude": lons,
        "current": [
            "wave_height",
            "wave_period",
            "wave_direction",
            "swell_wave_height",
            "swell_wave_period",
            "swell_wave_direction",
            "ocean_current_velocity",
            "ocean_current_direction"
        ],
        "timezone": "America/Recife"
    }

    print("[MARINE-CURRENT] Requisitando condições atuais do mar...")
    response = requests.get("https://marine-api.open-meteo.com/v1/marine", params=params, timeout=30)
    response.raise_for_status()
    dados = response.json()

    if isinstance(dados, dict):
        dados = [dados]

    registros = []
    for ponto, item in zip(pontos, dados):
        curr = item.get("current", {})
        curr["ponto"] = ponto
        curr["latitude"] = item.get("latitude")
        curr["longitude"] = item.get("longitude")
        registros.append(curr)

    df = pd.DataFrame(registros)
    df["timestamp"] = pd.to_datetime(df["time"])
    df["ano"] = df["timestamp"].dt.year
    df["mes"] = df["timestamp"].dt.strftime("%m")
    df["dia"] = df["timestamp"].dt.strftime("%d")
    return df

def save_to_minio(df: pd.DataFrame) -> str:
    if df.empty:
        print("[MARINE-CURRENT] DataFrame vazio. Nenhum arquivo salvo.")
        return ""

    bucket = BUCKETS.get("meteo_marine", "open-meteo-marine")
    now = datetime.now()
    time_str = now.strftime("%H%M%S")

    for (ano, mes, dia), group in df.groupby(["ano", "mes", "dia"]):
        s3_file_path = f"s3://{bucket}/current/ano={ano}/mes={mes}/dia={dia}/marine_current_{time_str}.parquet"
        group_to_save = group.drop(columns=["ano", "mes", "dia"])
        group_to_save.to_parquet(
            s3_file_path,
            index=False,
            engine="pyarrow",
            compression="snappy",
            storage_options=STORAGE_OPTIONS
        )

    print(f"[MARINE-CURRENT] Sucesso! Arquivos nomeados salvos em s3://{bucket}/current/")
    return f"s3://{bucket}/current/"

def update_bronze_view():
    conn = get_duckdb_conn()
    conn.execute("CREATE SCHEMA IF NOT EXISTS bronze")
    bucket = BUCKETS.get("meteo_marine", "open-meteo-marine")
    s3_pattern = f"s3://{bucket}/current/**/*.parquet"

    conn.execute(f"""
        CREATE OR REPLACE VIEW bronze.open_meteo_marine_current AS
        SELECT * FROM read_parquet('{s3_pattern}', hive_partitioning=1)
    """)
    conn.close()
    print(f"[MARINE-CURRENT] VIEW bronze.open_meteo_marine_current atualizada/verificada apontando para {s3_pattern}.")

def main():
    df = fetch_marine_current()
    save_to_minio(df)
    update_bronze_view()

if __name__ == "__main__":
    main()
