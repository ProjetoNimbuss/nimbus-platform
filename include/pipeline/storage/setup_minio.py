import os
import sys
from minio import Minio
from minio.error import S3Error

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from config.settings import MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY

BUCKETS = [
    "web-scraping-apac",
    "cemaden-api",
    "open-meteo-weather",
    "open-meteo-marine",
    "tomorrow-api",
]


def get_client() -> Minio:
    endpoint = MINIO_ENDPOINT.replace("http://", "").replace("https://", "")
    use_ssl = MINIO_ENDPOINT.startswith("https://")
    return Minio(
        endpoint=endpoint,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=use_ssl,
    )


def setup_buckets() -> None:
    client = get_client()
    print("Conectando ao MinIO:", MINIO_ENDPOINT)

    for bucket in BUCKETS:
        try:
            if not client.bucket_exists(bucket):
                client.make_bucket(bucket)
                print(f"  [CRIADO]    {bucket}")
            else:
                print(f"  [JÁ EXISTE] {bucket}")
        except S3Error as e:
            print(f"  [ERRO]      {bucket}: {e}")
            raise

    print("\nProvisionamento concluído.")


if __name__ == "__main__":
    setup_buckets()
