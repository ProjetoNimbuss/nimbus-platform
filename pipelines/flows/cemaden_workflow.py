from prefect import flow, task

from pipelines.extract.extract_cemaden import fetch_data, save_partitioned
from pipelines.flows.tasks.dataform_task import task_run_dataform

task_fetch_cemaden = task(fetch_data, name="fetch-cemaden-data", retries=3, retry_delay_seconds=30)
task_save_cemaden = task(save_partitioned, name="save-cemaden-gcs")


@flow(name="cemaden-ingestion-flow", log_prints=True)
def cemaden_flow():
    # 1. Ingestão Bronze (GCS)
    df = task_fetch_cemaden()
    gcs_path = task_save_cemaden(df)
    
    # 2. Execução Subsequente da Silver (apenas a tabela do CEMADEN)
    if gcs_path:
        task_run_dataform(tags=["cemaden", "silver"])


if __name__ == "__main__":
    cemaden_flow()
