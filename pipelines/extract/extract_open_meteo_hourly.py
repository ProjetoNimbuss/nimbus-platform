import requests
import pandas as pd
from datetime import datetime

try:
    from pipelines.config.settings import BUCKETS
except ImportError:
    from config.settings import BUCKETS


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



def fetch_hourly() -> pd.DataFrame:
    cidades = list(CITIES.keys())
    lats_tuple, lons_tuple = zip(*CITIES.values())

    lats = ",".join(map(str, lats_tuple))
    lons = ",".join(map(str, lons_tuple))

    params = {
        "latitude": lats,
        "longitude": lons,
        "hourly": [
            "temperature_2m",
            "relative_humidity_2m",
            "precipitation_probability",
            "precipitation",
            "cloud_cover",
            "wind_speed_10m",
        ],
        "models": "gfs_seamless,ecmwf_ifs04",
        "forecast_days": 7,
        "timezone": "America/Recife",
    }

    print("[HOURLY] Requisitando previsão horária...")
    response = requests.get("https://api.open-meteo.com/v1/forecast", params=params, timeout=30)
    response.raise_for_status()
    dados = response.json()

    if isinstance(dados, dict):
        dados = [dados]

    lista_dfs = []
    for cidade, item in zip(cidades, dados):
        df_cidade = pd.DataFrame(item.get("hourly", {}))
        df_cidade["cidade"] = cidade
        df_cidade["latitude"] = item.get("latitude")
        df_cidade["longitude"] = item.get("longitude")
        lista_dfs.append(df_cidade)

    df_total = pd.concat(lista_dfs, ignore_index=True)
    df_total["data_extracao"] = datetime.now().strftime("%Y-%m-%d")
    return df_total


def save_to_gcs(df_total: pd.DataFrame) -> str:
    if df_total.empty:
        print("[HOURLY] DataFrame vazio. Nenhum arquivo salvo.")
        return ""

    bucket = BUCKETS.get("meteo_weather")
    now = datetime.now()
    time_str = now.strftime("%H%M%S")

    df_total["uf"] = "PE"
    for (uf, dt_ext), group in df_total.groupby(["uf", "data_extracao"]):
        gcs_file_path = f"gs://{bucket}/forecast_hourly/uf={uf}/data_extracao={dt_ext}/hourly_{time_str}.parquet"
        group_to_save = group.drop(columns=["uf", "data_extracao"])
        group_to_save.to_parquet(
            gcs_file_path,
            index=False,
            engine="pyarrow",
            compression="snappy",
        )

    print(f"[HOURLY] Sucesso! Arquivos salvos em gs://{bucket}/forecast_hourly/")
    return f"gs://{bucket}/forecast_hourly/"


def update_bronze_view():
    """Placeholder compatível para orquestração."""
    pass


def main():
    df = fetch_hourly()
    save_to_gcs(df)



if __name__ == "__main__":
    main()
