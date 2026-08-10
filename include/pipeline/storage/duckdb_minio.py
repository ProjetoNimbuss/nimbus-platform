"""
duckdb_minio.py
──────────────────────────────────────────────────────────────────────────────
Utilitário para criar conexões DuckDB com o MinIO configurado via httpfs.

O DuckDB >= 1.0 suporta MinIO nativamente via extensão httpfs usando
CREATE SECRET com TYPE S3 e URL_STYLE 'path' (obrigatório para MinIO local).

Uso:
    from include.pipeline.storage.duckdb_minio import get_duckdb_conn

    conn = get_duckdb_conn()
    df = conn.execute(
        "SELECT * FROM read_parquet('s3://cemaden-api/**/*.parquet', hive_partitioning=1)"
    ).df()
"""

import os
import sys
import duckdb

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from config.settings import MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, DB_PATH


def get_duckdb_conn(db_path: str = str(DB_PATH)) -> duckdb.DuckDBPyConnection:
    """
    Retorna uma conexão DuckDB com httpfs configurado para o MinIO local.

    O secret é criado com OR REPLACE para ser idempotente — seguro chamar
    múltiplas vezes na mesma sessão ou em DAGs paralelas.

    Args:
        db_path: Caminho para o arquivo .duckdb. Usa DB_PATH por padrão.

    Returns:
        Conexão DuckDB pronta para ler/escrever no MinIO via s3://.
    """
    # Extrai host:port do endpoint (remove protocolo)
    endpoint = MINIO_ENDPOINT.replace("http://", "").replace("https://", "")
    use_ssl = "true" if MINIO_ENDPOINT.startswith("https://") else "false"

    conn = duckdb.connect(db_path)

    conn.execute("INSTALL httpfs; LOAD httpfs;")

    conn.execute(f"""
        CREATE OR REPLACE SECRET minio_secret (
            TYPE         S3,
            KEY_ID       '{MINIO_ACCESS_KEY}',
            SECRET       '{MINIO_SECRET_KEY}',
            ENDPOINT     '{endpoint}',
            USE_SSL      {use_ssl},
            URL_STYLE    'path'
        );
    """)

    return conn


def get_duckdb_conn_memory() -> duckdb.DuckDBPyConnection:
    """
    Retorna conexão DuckDB in-memory com MinIO configurado.
    Útil para leituras pontuais sem persistência local.
    """
    endpoint = MINIO_ENDPOINT.replace("http://", "").replace("https://", "")
    use_ssl = "true" if MINIO_ENDPOINT.startswith("https://") else "false"

    conn = duckdb.connect(":memory:")

    conn.execute("INSTALL httpfs; LOAD httpfs;")

    conn.execute(f"""
        CREATE OR REPLACE SECRET minio_secret (
            TYPE         S3,
            KEY_ID       '{MINIO_ACCESS_KEY}',
            SECRET       '{MINIO_SECRET_KEY}',
            ENDPOINT     '{endpoint}',
            USE_SSL      {use_ssl},
            URL_STYLE    'path'
        );
    """)

    return conn
