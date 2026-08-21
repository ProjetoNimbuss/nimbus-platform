import os
import sys
import duckdb

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from config.settings import MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, DB_PATH


def get_duckdb_conn(db_path: str = str(DB_PATH)) -> duckdb.DuckDBPyConnection:
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
