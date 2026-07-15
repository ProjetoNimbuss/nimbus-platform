import requests
import pandas as pd
import json
import sys
import os
import duckdb
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from config.settings import CEMADEN_DIR, DB_PATH

URL = "http://dados.apac.pe.gov.br:41120/cemaden/"

def fetch_data() -> pd.DataFrame:
    """Busca dados da API e retorna DataFrame normalizado de forma eficiente."""
    response = requests.get(URL, timeout=30)
    response.raise_for_status()
    dados = response.json()

    df = pd.DataFrame(dados)

    # Otimização: uso de list comprehension e json_normalize em vez de .apply(pd.Series)
    dados_completos = [json.loads(x) if isinstance(x, str) else {} for x in df["Dados_completos"]]
    df_norm = pd.json_normalize(dados_completos).add_prefix("dc_")
    
    df = pd.concat([df.drop(columns=["Dados_completos"]).reset_index(drop=True), df_norm.reset_index(drop=True)], axis=1)

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
        "data_hora", "estacao_nome", "codigo_gmmc", "chuva",
        "latitude", "longitude", "cidade", "nome_estacao",
        "tipo", "uf", "ingestao_ts"
    ]
    return df[cols]

def save_partitioned(df: pd.DataFrame) -> str:
    """Salva o DataFrame em formato Parquet particionado pela data do dado (Event Time)."""
    if df.empty:
        print("DataFrame vazio. Nenhum arquivo salvo.")
        return ""

    # Determina a data de partição a partir do registro mais recente obtido
    data_referencia = df["data_hora"].max()
    if pd.isnull(data_referencia):
        data_referencia = datetime.now()

    partition_dir = CEMADEN_DIR / f"ano={data_referencia.year}" / f"mes={data_referencia.month:02d}" / f"dia={data_referencia.day:02d}"
    partition_dir.mkdir(parents=True, exist_ok=True)

    # Identificador de timestamp único no dia para evitar colisões de arquivos
    now = datetime.now()
    filename = f"{now.strftime('%H-%M-%S')}.parquet"
    filepath = partition_dir / filename

    df.to_parquet(filepath, index=False)
    return str(filepath)

def update_bronze_view():
    """Cria ou atualiza a VIEW no DuckDB apontando para todos os arquivos Parquet."""
    conn = duckdb.connect(DB_PATH)
    conn.execute("CREATE SCHEMA IF NOT EXISTS bronze")

    path_pattern = str(CEMADEN_DIR / "**" / "*.parquet")

    conn.execute(f"""
        CREATE OR REPLACE VIEW bronze.data_cemaden AS
        SELECT * FROM read_parquet('{path_pattern}', hive_partitioning=1)
    """)

    conn.close()
    print(f"VIEW bronze.data_cemaden atualizada/verificada apontando para {CEMADEN_DIR}.")

def executar_pipeline():
    """Função principal para execução local."""
    print("Iniciando extração CEMADEN...")
    df = fetch_data()
    print(f"{len(df)} registros obtidos.")

    path = save_partitioned(df)
    print(f"Dados salvos em Raw: {path}")

    print("Atualizando VIEW no DuckDB...")
    update_bronze_view()
    print("Pipeline CEMADEN concluído.")

if __name__ == "__main__":
    executar_pipeline()
