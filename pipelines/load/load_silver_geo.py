"""
Script de Carga Direta dos Dados Geográficos e Estáticos na Camada Silver:
Bucket: gs://nimbus-506613-geo-complementares/ -> Dataset BigQuery: nimbus_silver_prod

Executado para materializar as tabelas estáticas de dimensão:
1. silver_reindesc_desastres (histórico de ocorrências da Defesa Civil)
2. silver_ibge_bairros_censo_pe (consolidação dos 6 CSVs do Censo IBGE 2022 filtrados para PE)
3. silver_geo_bairros_pe (malha cadastral de bairros de Pernambuco)
4. silver_ibge_municipios_pe (municípios e centróides de PE)
"""

import sys
import os
import io
import tempfile
import sqlite3
import pandas as pd
from google.cloud import storage, bigquery

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
try:
    from pipelines.config.settings import GCP_PROJECT_ID, BUCKETS
except ImportError:
    from config.settings import GCP_PROJECT_ID, BUCKETS

PROJECT_ID = GCP_PROJECT_ID or "nimbus-506613"
DATASET_SILVER = "nimbus_silver_prod"
BUCKET_GEO = BUCKETS.get("geo_complementares", f"{PROJECT_ID}-geo-complementares")

gcs_client = storage.Client(project=PROJECT_ID)
bq_client = bigquery.Client(project=PROJECT_ID)
bucket = gcs_client.bucket(BUCKET_GEO)


def upload_dataframe_to_bigquery(df: pd.DataFrame, table_name: str, write_disposition="WRITE_TRUNCATE"):
    """Carrega um DataFrame pandas diretamente no BigQuery via LoadJob oficial."""
    table_id = f"{PROJECT_ID}.{DATASET_SILVER}.{table_name}"
    job_config = bigquery.LoadJobConfig(write_disposition=write_disposition)
    
    print(f"  Enviando {len(df)} registros para {table_id}...")
    job = bq_client.load_table_from_dataframe(df, table_id, job_config=job_config)
    job.result()  # Aguarda a conclusão
    print(f"  [SUCESSO] Tabela {table_id} carregada com sucesso.")


def load_reindesc_desastres():
    print("\n[1/4] Carregando REINDESC Desastres...")
    blob = bucket.blob("reindesc_tabela_ocorrencias.csv")
    if not blob.exists():
        print("  [AVISO] Arquivo reindesc_tabela_ocorrencias.csv não encontrado no bucket.")
        return

    content = blob.download_as_bytes().decode("utf-8-sig", errors="ignore")
    df = pd.read_csv(io.StringIO(content), sep=";")
    
    col_map = {
        "ID ocorrência": "id_ocorrencia",
        "Data": "data_ocorrencia",
        "Horário da ocorrência": "horario_ocorrencia",
        "Município": "municipio",
        "UF": "uf",
        "Tipologia": "tipologia",
        "Magnitude": "magnitude",
        "Precisão": "precisao_geografica",
        "Latitude": "latitude",
        "Longitude": "longitude"
    }
    cols_existentes = [c for c in col_map.keys() if c in df.columns]
    df = df[cols_existentes].rename(columns=col_map)
    
    if "id_ocorrencia" in df.columns:
        df["id_ocorrencia"] = pd.to_numeric(df["id_ocorrencia"], errors="coerce")
    if "data_ocorrencia" in df.columns:
        df["data_ocorrencia"] = pd.to_datetime(df["data_ocorrencia"], errors="coerce").dt.date
    if "latitude" in df.columns:
        df["latitude"] = pd.to_numeric(df["latitude"], errors="coerce")
    if "longitude" in df.columns:
        df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")
    if "municipio" in df.columns:
        df["municipio"] = df["municipio"].astype(str).str.strip().str.upper()

    upload_dataframe_to_bigquery(df, "silver_reindesc_desastres")


def load_censo_consolidado():
    print("\n[2/4] Consolidando CSVs do Censo IBGE 2022 para Pernambuco (código 26)...")
    arquivos = {
        "demo": (
            "Agregados_por_bairros_demografia_BR.csv",
            {
                "V01006": "populacao_total",
                "V01007": "populacao_homens",
                "V01008": "populacao_mulheres"
            }
        ),
        "alfa": (
            "Agregados_por_bairros_alfabetizacao_BR.csv",
            {
                "V00644": "populacao_alfabetizada"
            }
        ),
        "dom1": (
            "Agregados_por_bairros_caracteristicas_domicilio1_BR.csv",
            {
                "V00001": "total_domicilios",
                "V00004": "domicilios_improvisados"
            }
        ),
        "dom2": (
            "Agregados_por_bairros_caracteristicas_domicilio2_BR.csv",
            {
                "V00092": "domicilios_sem_esgoto",
                "V00094": "domicilios_sem_coleta_lixo"
            }
        ),
        "dom3": (
            "Agregados_por_bairros_caracteristicas_domicilio3_BR.csv",
            {
                "V00500": "media_moradores_por_comodo"
            }
        )
    }
    
    df_consolidado = None
    for chave, (arq_nome, col_renomear) in arquivos.items():
        blob = bucket.blob(arq_nome)
        if not blob.exists():
            print(f"  [AVISO] {arq_nome} não encontrado, pulando...")
            continue
            
        print(f"  Processando {arq_nome}...")
        conteudo = blob.download_as_bytes().decode("latin1", errors="ignore")
        df_temp = pd.read_csv(io.StringIO(conteudo), sep=";", low_memory=False)
        
        # Filtra estritamente Pernambuco (código 26)
        df_pe = df_temp[df_temp["CD_BAIRRO"].astype(str).str.startswith("26")].copy()
        df_pe["CD_BAIRRO"] = pd.to_numeric(df_pe["CD_BAIRRO"], errors="coerce").astype("Int64")
        
        cols_interesse = ["CD_BAIRRO", "NM_BAIRRO"] + list(col_renomear.keys())
        cols_existentes = [c for c in cols_interesse if c in df_pe.columns]
        df_pe = df_pe[cols_existentes].rename(columns=col_renomear)
        
        # Converte métricas para numéricas
        for nova_col in col_renomear.values():
            if nova_col in df_pe.columns:
                df_pe[nova_col] = pd.to_numeric(df_pe[nova_col], errors="coerce")
        
        if df_consolidado is None:
            df_consolidado = df_pe
        else:
            cols_join = [c for c in df_pe.columns if c not in ["NM_BAIRRO"]]
            df_consolidado = df_consolidado.merge(df_pe[cols_join], on="CD_BAIRRO", how="left")
            
    if df_consolidado is not None and not df_consolidado.empty:
        df_consolidado.rename(columns={"CD_BAIRRO": "codigo_bairro", "NM_BAIRRO": "nome_bairro"}, inplace=True)
        if "nome_bairro" in df_consolidado.columns:
            df_consolidado["nome_bairro"] = df_consolidado["nome_bairro"].astype(str).str.strip().str.upper()
        upload_dataframe_to_bigquery(df_consolidado, "silver_ibge_bairros_censo_pe")
    else:
        print("  [AVISO] Nenhum dado do censo foi consolidado.")


def load_geo_bairros():
    print("\n[3/4] Extraindo malha de bairros de PE_bairros_CD2022.gpkg...")
    blob = bucket.blob("PE_bairros_CD2022.gpkg")
    if not blob.exists():
        print("  [AVISO] PE_bairros_CD2022.gpkg não encontrado no bucket.")
        return

    with tempfile.NamedTemporaryFile(suffix=".gpkg") as tmp:
        blob.download_to_filename(tmp.name)
        conn = sqlite3.connect(tmp.name)
        df = pd.read_sql_query(
            "SELECT CD_BAIRRO, NM_BAIRRO, CD_MUN, NM_MUN, AREA_KM2 FROM PE_bairros_CD2022",
            conn
        )
        conn.close()
        
    df.rename(columns={
        "CD_BAIRRO": "codigo_bairro",
        "NM_BAIRRO": "nome_bairro",
        "CD_MUN": "codigo_municipio",
        "NM_MUN": "nome_municipio",
        "AREA_KM2": "area_km2"
    }, inplace=True)
    
    df["codigo_bairro"] = pd.to_numeric(df["codigo_bairro"], errors="coerce").astype("Int64")
    df["codigo_municipio"] = pd.to_numeric(df["codigo_municipio"], errors="coerce").astype("Int64")
    df["area_km2"] = pd.to_numeric(df["area_km2"], errors="coerce")
    df["nome_bairro"] = df["nome_bairro"].astype(str).str.strip().str.upper()
    df["nome_municipio"] = df["nome_municipio"].astype(str).str.strip().str.upper()
    
    upload_dataframe_to_bigquery(df, "silver_geo_bairros_pe")


def load_municipios():
    print("\n[4/4] Carregando municípios PE...")
    blob = bucket.blob("municipios_pe_geo.parquet")
    if blob.exists():
        content = blob.download_as_bytes()
        df = pd.read_parquet(io.BytesIO(content))
        upload_dataframe_to_bigquery(df, "silver_ibge_municipios_pe")
    else:
        print("  [INFO] municipios_pe_geo.parquet não encontrado no bucket geo_complementares (gerado via script).")


if __name__ == "__main__":
    print(f"=== INICIANDO CARGA DIRETA NA CAMADA SILVER ({DATASET_SILVER}) ===")
    load_reindesc_desastres()
    load_censo_consolidado()
    load_geo_bairros()
    load_municipios()
    print("\n=== CARGA DIRETA CONCLUÍDA COM SUCESSO ===")
