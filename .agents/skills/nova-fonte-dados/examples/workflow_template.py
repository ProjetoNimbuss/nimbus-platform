"""
Template de flow Prefect Nimbus.
Substitua `fonte` pelo nome da fonte (snake_case).
"""

from prefect import flow, task

from pipelines.extract.extract_fonte import fetch_data, save_partitioned
from pipelines.flows.tasks.dataform_task import task_run_dataform

task_fetch_fonte = task(fetch_data, name="fetch-fonte-data", retries=3, retry_delay_seconds=30)
task_save_fonte = task(save_partitioned, name="save-fonte-gcs")


@flow(name="fonte-ingestion-flow", log_prints=True)
def fonte_flow():
    # 1. Ingestão Bronze (GCS)
    df = task_fetch_fonte()
    gcs_path = task_save_fonte(df)

    # 2. Silver apenas dos modelos com a tag da fonte
    if gcs_path:
        task_run_dataform(tags=["fonte"])


if __name__ == "__main__":
    fonte_flow()
