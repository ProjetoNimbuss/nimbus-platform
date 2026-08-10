import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()  # garante que .env é lido ao executar scripts localmente


# ─── Caminhos ─────────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Diretórios de Dados
DATA_DIR   = PROJECT_ROOT / "data"
RAW_DIR    = DATA_DIR / "raw"
CEMADEN_DIR = RAW_DIR / "api_cemaden"

# Caminho do Banco de Dados
DB_PATH = str(DATA_DIR / "pepluvi.duckdb")

# URLs e Configurações de Scraping
BASE_URL = os.getenv("APAC_BASE_URL", "http://old.apac.pe.gov.br/meteorologia/monitoramento-pluvio.php")

# Certifique-se de que os diretórios existem
RAW_DIR.mkdir(parents=True, exist_ok=True)

# URL API IBGE
URL_API_IBGE = "https://servicodados.ibge.gov.br/api/v1/localidades/estados/26/municipios"


# ─── MinIO (Object Storage) ───────────────────────────────────────────────────
MINIO_ENDPOINT   = os.getenv("MINIO_ENDPOINT", "http://localhost:9000")
MINIO_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID", "")
MINIO_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")

BUCKETS = {
    "apac":          "web-scraping-apac",
    "cemaden":       "cemaden-api",
    "meteo_weather": "open-meteo-weather",
    "meteo_marine":  "open-meteo-marine",
    "tomorrow":      "tomorrow-api",
}

