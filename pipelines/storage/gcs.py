from datetime import datetime
import pandas as pd
from config.settings import BUCKETS, GCP_PROJECT_ID



def get_bucket_name(bucket_key: str) -> str:
    """Retorna o nome real do bucket no GCS."""
    return BUCKETS.get(bucket_key, f"{GCP_PROJECT_ID}-{bucket_key}")


def save_dataframe_to_gcs(
    df: pd.DataFrame,
    bucket_key: str,
    subpath: str = "",
    ref_date: datetime = None,
    filename: str = None,
) -> str:
    """
    Salva um DataFrame pandas no Google Cloud Storage em formato Parquet
    com particionamento Hive (ano=YYYY/mes=MM/dia=DD).
    """
    if df.empty:
        print(f"[GCS] DataFrame vazio para {bucket_key}. Nenhum arquivo salvo.")
        return ""

    bucket = get_bucket_name(bucket_key)

    if ref_date is None or pd.isnull(ref_date):
        ref_date = datetime.now()

    now = datetime.now()
    if filename is None:
        filename = f"{now.strftime('%H-%M-%S')}.parquet"

    partition = f"ano={ref_date.year}/mes={ref_date.month:02d}/dia={ref_date.day:02d}"

    if subpath:
        gcs_path = f"gs://{bucket}/{subpath.strip('/')}/{partition}/{filename}"
    else:
        gcs_path = f"gs://{bucket}/{partition}/{filename}"

    df.to_parquet(gcs_path, index=False, engine="pyarrow", compression="snappy")
    print(f"[GCS] Arquivo salvo com sucesso: {gcs_path}")
    return gcs_path
