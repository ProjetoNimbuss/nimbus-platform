import requests
import pandas as pd
import json
import sys
import os
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from storage.gcs import save_dataframe_to_gcs



URL = "http://dados.apac.pe.gov.br:41120/cemaden/"


def fetch_data() -> pd.DataFrame:
    # Busca dados da API e retorna DataFrame normalizado de forma eficiente
    response = requests.get(URL, timeout=30)
    response.raise_for_status()
    dados = response.json()

    df = pd.DataFrame(dados)

    # Otimização: uso de list comprehension e json_normalize em vez de .apply(pd.Series)
    dados_completos = [json.loads(x) if isinstance(x, str) else {} for x in df["Dados_completos"]]
    df_norm = pd.json_normalize(dados_completos).add_prefix("dc_")

    df = pd.concat(
        [
            df.drop(columns=["Dados_completos"]).reset_index(drop=True),
            df_norm.reset_index(drop=True),
        ],
        axis=1,
    )

    col_map = {
        "Data-hora": "data_hora",
        "Estação": "estacao_nome",
        "Codigo_gmmc": "codigo_gmmc",
        "dc_chuva": "chuva",
        "dc_latitude": "latitude",
        "dc_longitude": "longitude",
        "dc_cidade": "cidade",
        "dc_nome": "nome_estacao",
        "dc_tipo": "tipo",
        "dc_uf": "uf",
    }
    df.rename(columns=col_map, inplace=True)

    df["data_hora"] = pd.to_datetime(df["data_hora"])

    # Cast tipos numéricos (substituindo erros/espaços vazios por NaN)
    for col in ["chuva", "latitude", "longitude"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    # Cast strings para garantir que não haja tipos mistos (que quebram o Parquet)
    for col in ["estacao_nome", "codigo_gmmc", "cidade", "nome_estacao", "tipo", "uf"]:
        df[col] = df[col].astype(str)

    df["ingestao_ts"] = datetime.now()

    cols = [
        "data_hora",
        "estacao_nome",
        "codigo_gmmc",
        "chuva",
        "latitude",
        "longitude",
        "cidade",
        "nome_estacao",
        "tipo",
        "uf",
        "ingestao_ts",
    ]
    return df[cols]


def save_partitioned(df: pd.DataFrame) -> str:
    # Salva o DataFrame em formato Parquet particionado no Google Cloud Storage
    if df.empty:
        print("DataFrame vazio. Nenhum arquivo salvo.")
        return ""

    data_referencia = df["data_hora"].max()
    return save_dataframe_to_gcs(df, bucket_key="cemaden", ref_date=data_referencia)


def update_bronze_view():
    """Placeholder compatível para orquestração."""
    pass


def executar_pipeline():
    print("Iniciando extração CEMADEN...")
    df = fetch_data()
    print(f"{len(df)} registros obtidos.")

    path = save_partitioned(df)
    print(f"Dados salvos no GCS: {path}")
    print("Pipeline CEMADEN concluído.")



if __name__ == "__main__":
    executar_pipeline()
