from prefect import flow, task
from pipelines.extract.extract_apac import run_apac_scraper

task_scrape_apac = task(
    run_apac_scraper,
    name="scrape-apac-data",
    retries=2,
    retry_delay_seconds=60,
)


@flow(name="apac-ingestion-flow", log_prints=True)
def apac_flow(ano_inicio: int = 1961, ano_fim: int = None):
    """Fluxo Prefect para raspagem e ingestão da APAC diretamente no GCS."""
    print("Iniciando fluxo de ingestão APAC...")
    total = task_scrape_apac(ano_inicio=ano_inicio, ano_fim=ano_fim)
    print(f"Fluxo APAC finalizado. Total de arquivos salvos: {total}.")
    return total


if __name__ == "__main__":
    apac_flow()
