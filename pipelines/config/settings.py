import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Diretórios de Dados
DATA_DIR = PROJECT_ROOT / "data"

# Google Cloud Platform
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID")
ENVIRONMENT = os.getenv("ENVIRONMENT", os.getenv("APP_ENV", "prod"))

if not GCP_PROJECT_ID:
    raise ValueError(
        "A variável de ambiente GCP_PROJECT_ID é obrigatória e não foi definida no arquivo .env."
    )


# URLs Scraping APAC
BASE_URL = os.getenv(
    "APAC_BASE_URL", "http://old.apac.pe.gov.br/meteorologia/monitoramento-pluvio.php"
)

# URL API IBGE
URL_API_IBGE = "https://servicodados.ibge.gov.br/api/v1/localidades/estados/26/municipios"

# Tomorrow.io
TOMORROW_IO_API_KEY = os.getenv("TOMORROW_IO_API_KEY", "")

# Google Cloud Storage - Buckets
BUCKETS = {
    "apac": f"{GCP_PROJECT_ID}-bronze-apac",
    "cemaden": f"{GCP_PROJECT_ID}-bronze-cemaden",
    "meteo_weather": f"{GCP_PROJECT_ID}-bronze-open-meteo-weather",
    "meteo_marine": f"{GCP_PROJECT_ID}-bronze-open-meteo-marine",
    "tomorrow": f"{GCP_PROJECT_ID}-bronze-tomorrow-api",
    "geo_complementares": f"{GCP_PROJECT_ID}-geo-complementares",
    "reports": f"{GCP_PROJECT_ID}-img-reports-app",
}

DATA_DIR.mkdir(parents=True, exist_ok=True)

