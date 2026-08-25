import os
import sys
import requests
import pandas as pd
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from config.settings import MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, BUCKETS
from pipeline.storage.duckdb_minio import get_duckdb_conn

CITIES = {
    "Recife": (-8.0539, -34.8811),
    "Jaboatão dos Guararapes": (-8.1128, -35.0150),
    "Olinda": (-8.0089, -34.8550),
    "Paulista": (-7.9408, -34.8728),
    "Camaragibe": (-8.0219, -34.9811),
    "São Lourenço da Mata": (-8.0019, -35.0181),
    "Abreu e Lima": (-7.9119, -34.9028),
    "Igarassu": (-7.8342, -34.9064),
    "Cabo de Santo Agostinho": (-8.2869, -35.0350),
    "Ipojuca": (-8.3989, -35.0639),
    "Moreno": (-8.1178, -35.0950),
    "Itapissuma": (-7.7839, -34.8919),
    "Ilha de Itamaracá": (-7.7478, -34.8256),
    "Araçoiaba": (-7.7819, -35.0489),
}

STORAGE_OPTIONS = {
    "key": MINIO_ACCESS_KEY,
    "secret": MINIO_SECRET_KEY,
    "client_kwargs": {"endpoint_url": MINIO_ENDPOINT},
}


def fetch_current() -> pd.DataFrame:
    cidades = list(CITIES.keys())
    lats_tuple, lons_tuple = zip(*CITIES.values())

    lats = ",".join(map(str, lats_tuple))
    lons = ",".join(map(str, lons_tuple))

    params = {
        "latitude": lats,
        "longitude": lons,
        "current": [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "precipitation",
            "wind_speed_10m",
            "wind_direction_10m",
            "weather_code",
        ],
        "models": "gfs_seamless,ecmwf_ifs04",
        "timezone": "America/Recife",
    }

    print("[CURRENT] Requisitando dados atuais...")
    response = requests.get("https://api.open-meteo.com/v1/forecast", params=params, timeout=30)
    response.raise_for_status()
    dados = response.json()

    if isinstance(dados, dict):
        dados = [dados]

    registros = []
    for cidade, item in zip(cidades, dados):
        curr = item.get("current", {})
        curr["cidade"] = cidade
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
        print("[CURRENT] DataFrame vazio. Nenhum arquivo salvo.")
        return ""

    bucket = BUCKETS.get("meteo_weather", "open-meteo-weather")
    now = datetime.now()
    time_str = now.strftime("%H%M%S")

    df["uf"] = "PE"
    for (uf, ano, mes, dia), group in df.groupby(["uf", "ano", "mes", "dia"]):
        s3_file_path = f"s3://{bucket}/current/uf={uf}/ano={ano}/mes={mes}/dia={dia}/current_{time_str}.parquet"
        group_to_save = group.drop(columns=["uf", "ano", "mes", "dia"])
        group_to_save.to_parquet(
            s3_file_path,
            index=False,
            engine="pyarrow",
            compression="snappy",
            storage_options=STORAGE_OPTIONS,
        )

    print(f"[CURRENT] Sucesso! Arquivos nomeados salvos em s3://{bucket}/current/")
    return f"s3://{bucket}/current/"


def update_bronze_view():
    conn = get_duckdb_conn()
    conn.execute("CREATE SCHEMA IF NOT EXISTS bronze")
    bucket = BUCKETS.get("meteo_weather", "open-meteo-weather")
    s3_pattern = f"s3://{bucket}/current/**/*.parquet"

    conn.execute(f"""
        CREATE OR REPLACE VIEW bronze.open_meteo_current AS
        SELECT * FROM read_parquet('{s3_pattern}', hive_partitioning=1)
    """)
    conn.close()
    print(
        f"[CURRENT] VIEW bronze.open_meteo_current atualizada/verificada apontando para {s3_pattern}."
    )


def main():
    df = fetch_current()
    save_to_minio(df)
    update_bronze_view()


if __name__ == "__main__":
    main()
