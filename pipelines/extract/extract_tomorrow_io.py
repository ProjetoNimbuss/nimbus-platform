import time
import requests
import pandas as pd
from datetime import datetime, timezone

try:
    from pipelines.config.settings import (
        TOMORROW_IO_API_KEY,
        BUCKETS,
    )
except ImportError:
    from config.settings import (
        TOMORROW_IO_API_KEY,
        BUCKETS,
    )


POLOS_SENTINELA = {
    "Polo Central": ("Recife", -8.0539, -34.8811),
    "Polo Norte": ("Paulista", -7.9408, -34.8728),
    "Polo Sul": ("Cabo de Santo Agostinho", -8.2869, -35.0350),
    "Polo Oeste": ("São Lourenço da Mata", -8.0019, -35.0181),
}

HORIZONTE_HORAS = 12



def fetch_tomorrow_forecast() -> pd.DataFrame:
    registros_raw = []
    ts_ingestao = datetime.now(timezone.utc)

    print("[TOMORROW-IO] Requisitando previsão por pólos sentinela...")
    for polo_nome, (cidade_base, lat, lon) in POLOS_SENTINELA.items():
        url = "https://api.tomorrow.io/v4/weather/forecast"
        params = {
            "location": f"{lat},{lon}",
            "apikey": TOMORROW_IO_API_KEY,
            "units": "metric",
            "timesteps": "1h",
        }

        try:
            res = requests.get(url, params=params, timeout=15)
            res.raise_for_status()
            data = res.json()

            passos_horarios = data.get("timelines", {}).get("hourly", [])[:HORIZONTE_HORAS]

            for passo in passos_horarios:
                linha = passo.get("values", {}).copy()
                linha["time"] = passo.get("time")
                linha["polo"] = polo_nome
                linha["cidade_base"] = cidade_base
                linha["latitude_consulta"] = lat
                linha["longitude_consulta"] = lon
                linha["origem_api"] = "tomorrow_io_forecast_v4"
                linha["ingestion_timestamp_utc"] = ts_ingestao.isoformat()
                registros_raw.append(linha)

        except Exception as e:
            print(f"[TOMORROW-IO] Falha ao consultar {polo_nome}: {e}")

        time.sleep(0.5)

    if not registros_raw:
        print("[TOMORROW-IO] Nenhum registro retornado.")
        return pd.DataFrame()

    df_landing = pd.DataFrame(registros_raw)
    df_landing["data_ingestao"] = ts_ingestao.strftime("%Y-%m-%d")
    return df_landing


def save_to_gcs(df: pd.DataFrame) -> str:
    if df.empty:
        print("[TOMORROW-IO] DataFrame vazio. Nenhum arquivo salvo.")
        return ""

    bucket = BUCKETS.get("tomorrow")
    now = datetime.now()
    time_str = now.strftime("%H%M%S")

    df["uf"] = "PE"
    for (uf, dt_ing), group in df.groupby(["uf", "data_ingestao"]):
        gcs_file_path = f"gs://{bucket}/hourly_forecast/uf={uf}/data_ingestao={dt_ing}/tomorrow_{time_str}.parquet"
        group_to_save = group.drop(columns=["uf", "data_ingestao"])
        group_to_save.to_parquet(
            gcs_file_path,
            index=False,
            engine="pyarrow",
            compression="snappy",
        )

    print(f"[TOMORROW-IO] Sucesso! Arquivos salvos em gs://{bucket}/hourly_forecast/")
    return f"gs://{bucket}/hourly_forecast/"


def update_bronze_view():
    """Placeholder compatível para orquestração."""
    pass


def main():
    df = fetch_tomorrow_forecast()
    save_to_gcs(df)



if __name__ == "__main__":
    main()
