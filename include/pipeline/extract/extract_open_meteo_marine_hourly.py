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

def fetch_marine_hourly() -> pd.DataFrame:
    pontos = list(COASTAL_POINTS.keys())
    lats_tuple, lons_tuple = zip(*COASTAL_POINTS.values())

    lats = ",".join(map(str, lats_tuple))
    lons = ",".join(map(str, lons_tuple))

    params = {
        "latitude": lats,
        "longitude": lons,
        "hourly": [
            "wave_height",
            "wave_period",
            "wave_direction",
            "swell_wave_height",
            "swell_wave_period",
            "swell_wave_direction",
            "ocean_current_velocity",
            "ocean_current_direction"
        ],
        "forecast_days": 5,
        "timezone": "America/Recife"
    }

    print("[MARINE-HOURLY] Requisitando previsão horária de ondas...")
    response = requests.get("https://marine-api.open-meteo.com/v1/marine", params=params, timeout=30)
    response.raise_for_status()
    dados = response.json()

    if isinstance(dados, dict):
        dados = [dados]

    lista_dfs = []
    for ponto, item in zip(pontos, dados):
        df_ponto = pd.DataFrame(item.get("hourly", {}))
        df_ponto["ponto"] = ponto
        df_ponto["latitude"] = item.get("latitude")
        df_ponto["longitude"] = item.get("longitude")
        lista_dfs.append(df_ponto)

    df_total = pd.concat(lista_dfs, ignore_index=True)
    df_total["data_extracao"] = datetime.now().strftime("%Y-%m-%d")
    return df_total

def save_to_minio(df_total: pd.DataFrame) -> str:
    if df_total.empty:
        print("[MARINE-HOURLY] DataFrame vazio. Nenhum arquivo salvo.")
        return ""

    bucket = BUCKETS.get("meteo_marine", "open-meteo-marine")
    now = datetime.now()
    time_str = now.strftime("%H%M%S")

    df_total["uf"] = "PE"
    for (uf, dt_ext), group in df_total.groupby(["uf", "data_extracao"]):
        s3_file_path = f"s3://{bucket}/forecast_hourly/uf={uf}/data_extracao={dt_ext}/marine_hourly_{time_str}.parquet"
        group_to_save = group.drop(columns=["uf", "data_extracao"])
        group_to_save.to_parquet(
            s3_file_path,
            index=False,
            engine="pyarrow",
            compression="snappy",
            storage_options=STORAGE_OPTIONS
        )

    print(f"[MARINE-HOURLY] Sucesso! Arquivos nomeados salvos em s3://{bucket}/forecast_hourly/")
    return f"s3://{bucket}/forecast_hourly/"

def update_bronze_view():
    conn = get_duckdb_conn()
    conn.execute("CREATE SCHEMA IF NOT EXISTS bronze")
    bucket = BUCKETS.get("meteo_marine", "open-meteo-marine")
    s3_pattern = f"s3://{bucket}/forecast_hourly/**/*.parquet"

    conn.execute(f"""
        CREATE OR REPLACE VIEW bronze.open_meteo_marine_forecast_hourly AS
        SELECT * FROM read_parquet('{s3_pattern}', hive_partitioning=1)
    """)
    conn.close()
    print(f"[MARINE-HOURLY] VIEW bronze.open_meteo_marine_forecast_hourly atualizada/verificada apontando para {s3_pattern}.")

def main():
    df = fetch_marine_hourly()
    save_to_minio(df)
    update_bronze_view()

if __name__ == "__main__":
    main()
