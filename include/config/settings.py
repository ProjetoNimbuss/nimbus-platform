import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Diretórios de Dados
DATA_DIR = PROJECT_ROOT / "data"

# Banco de Dados DuckDB
DB_PATH = str(DATA_DIR / "nimbus.duckdb")

# URLs Scraping APAC
BASE_URL = os.getenv(
    "APAC_BASE_URL", "http://old.apac.pe.gov.br/meteorologia/monitoramento-pluvio.php"
)

# URL API IBGE
URL_API_IBGE = "https://servicodados.ibge.gov.br/api/v1/localidades/estados/26/municipios"

# MinIO
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "http://localhost:9000")
MINIO_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID", "")
MINIO_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")

# Tomorrow.io
TOMORROW_IO_API_KEY = os.getenv("TOMORROW_IO_API_KEY", "")

BUCKETS = {
    "apac": "web-scraping-apac",
    "cemaden": "cemaden-api",
    "meteo_weather": "open-meteo-weather",
    "meteo_marine": "open-meteo-marine",
    "tomorrow": "tomorrow-api",
    "geo_complementares": "dados-geo-complementares",
}

DATA_DIR.mkdir(parents=True, exist_ok=True)
