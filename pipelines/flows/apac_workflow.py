import sys
from pathlib import Path
from typing import Optional

# Garante a raiz do projeto no PYTHONPATH
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from prefect import flow, task
from pipelines.extract.extract_apac import run_apac_scraper
from pipelines.flows.tasks.dataform_task import task_run_dataform

task_scrape_apac = task(
    run_apac_scraper,
    name="scrape-apac-data",
    retries=2,
    retry_delay_seconds=60,
)


@flow(name="apac-ingestion-flow", log_prints=True)
def apac_flow(
    ano_inicio: Optional[int] = None,
    ano_fim: Optional[int] = None,
    forcar_atualizacao: bool = False,
):
    """Fluxo Prefect para raspagem e ingestão da APAC diretamente no GCS.

    Por padrão, atualiza apenas o ano corrente no GCS.
    Para cargas históricas completas, informe ano_inicio (ex: 1961).
    """
    print(
        f"Iniciando fluxo de ingestão APAC (ano_inicio={ano_inicio}, "
        f"ano_fim={ano_fim}, forcar_atualizacao={forcar_atualizacao})..."
    )
    total = task_scrape_apac(
        ano_inicio=ano_inicio,
        ano_fim=ano_fim,
        forcar_atualizacao=forcar_atualizacao,
    )

    # Execução Subsequente da Silver APAC (se salvou novos dados)
    if total > 0:
        task_run_dataform(tags=["apac"])

    print(f"Fluxo APAC finalizado. Total de arquivos salvos: {total}.")
    return total


if __name__ == "__main__":
    apac_flow()
