import sys
import os
import time
import requests
import pandas as pd

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from config.settings import URL_API_IBGE
from pipelines.storage.gcs import save_dataframe_to_gcs


NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
HEADERS = {"User-Agent": "PEPluvi/1.0"}


def get_coords(municipio: str) -> tuple[float, float] | tuple[None, None]:
    params = {
        "q": f"{municipio}, Pernambuco, Brasil",
        "format": "json",
        "limit": 1,
    }
    try:
        resp = requests.get(NOMINATIM_URL, params=params, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        if data:
            lat = float(data[0]["lat"])
            lon = float(data[0]["lon"])
            return lat, lon
    except Exception as e:
        print(f"Erro ao buscar '{municipio}': {e}")
    return None, None


def fetch_ibge_municipios() -> pd.DataFrame:
    print("Buscando municípios de Pernambuco na API do IBGE...")
    resp = requests.get(URL_API_IBGE, timeout=30)
    resp.raise_for_status()
    dados = resp.json()

    lista = []
    for item in dados:
        lista.append({
            "codigo_ibge": item["id"],
            "municipio": item["nome"],
        })
    return pd.DataFrame(lista)


def main():
    df = fetch_ibge_municipios()
    lats = []
    lons = []

    total = len(df)
    for i, row in df.iterrows():
        nome = row["municipio"]
        print(f"[{i + 1:3d}/{total}] Obtendo coordenadas de {nome}...")
        lat, lon = get_coords(nome)
        lats.append(lat)
        lons.append(lon)
        time.sleep(1.1)

    df["latitude"] = lats
    df["longitude"] = lons

    # Salva no GCS
    save_dataframe_to_gcs(
        df,
        bucket_key="geo_complementares",
        filename="municipios_pe_geo.parquet",
    )
    print("Processamento IBGE concluído com sucesso.")


if __name__ == "__main__":
    main()

