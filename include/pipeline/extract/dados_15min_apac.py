import requests
import pandas as pd
import json
import sys
import os
import duckdb
from datetime import datetime

# Adiciona o diretório raiz ao PYTHONPATH para localizar 'config'
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from config.settings import CEMADEN_DIR, DB_PATH

URL = "http://dados.apac.pe.gov.br:41120/cemaden/"

def fetch_data() -> pd.DataFrame:
    """Busca dados da API e retorna DataFrame normalizado."""
    response = requests.get(URL, timeout=30)
    response.raise_for_status()
    dados = response.json()

    df = pd.DataFrame(dados)

    # Normaliza o campo 'Dados_completos' (string JSON -> dict)
    df_norm = df["Dados_completos"].apply(json.loads).apply(pd.Series)
    df = pd.concat([df.drop(columns=["Dados_completos"]), df_norm.add_prefix("dc_")], axis=1)

    # Renomeia colunas para padronização
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
    """Salva o DataFrame em formato Parquet particionado por data (Hive)."""
    now = datetime.now()
    partition_dir = CEMADEN_DIR / f"ano={now.year}" / f"mes={now.month:02d}" / f"dia={now.day:02d}"
    partition_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{now.strftime('%H-%M-%S')}.parquet"
    filepath = partition_dir / filename

    df.to_parquet(filepath, index=False)
    return str(filepath)

def update_bronze_view():
    """Cria ou atualiza uma VIEW no DuckDB que aponta para todos os Parquets da Raw."""
    conn = duckdb.connect(DB_PATH)
    conn.execute("CREATE SCHEMA IF NOT EXISTS bronze")

    # O DuckDB usa '**/*.parquet' para ler recursivamente todas as partições Hive
    # O parâmetro hive_partitioning=1 faz com que 'ano', 'mes' e 'dia' virem colunas automáticas
    path_pattern = str(CEMADEN_DIR / "**" / "*.parquet")

    conn.execute(f"""
        CREATE OR REPLACE VIEW bronze.apac_15min_bronze AS
        SELECT * FROM read_parquet('{path_pattern}', hive_partitioning=1)
    """)

    conn.close()
    print(f"VIEW bronze.apac_15min_bronze atualizada/verificada apontando para {CEMADEN_DIR}.")

def executar_pipeline():
    """Função principal para execução local (Airflow chamará as funções individualmente)."""
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
