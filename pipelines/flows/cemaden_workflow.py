from prefect import flow, task

from pipelines.extract.extract_cemaden import fetch_data, save_partitioned

task_fetch_cemaden = task(fetch_data, name="fetch-cemaden-data", retries=3, retry_delay_seconds=30)
task_save_cemaden = task(save_partitioned, name="save-cemaden-gcs")


@flow(name="cemaden-ingestion-flow", log_prints=True)
def cemaden_flow():
    df = task_fetch_cemaden()
    task_save_cemaden(df)


if __name__ == "__main__":
    cemaden_flow()

