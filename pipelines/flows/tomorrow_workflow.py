from prefect import flow, task
from pipelines.extract.extract_tomorrow_io import fetch_tomorrow_forecast, save_to_gcs
from pipelines.flows.tasks.dataform_task import task_run_dataform

task_fetch_tomorrow = task(
    fetch_tomorrow_forecast,
    name="fetch-tomorrow-forecast",
    retries=3,
    retry_delay_seconds=30,
)
task_save_tomorrow = task(save_to_gcs, name="save-tomorrow-gcs")


@flow(name="tomorrow-io-ingestion-flow", log_prints=True)
def tomorrow_flow():
    """Fluxo Prefect para previsão nowcasting Tomorrow.io diretamente no GCS."""
    print("Iniciando fluxo de ingestão Tomorrow.io...")
    df = task_fetch_tomorrow()
    path = task_save_tomorrow(df)

    # Execução Subsequente da Silver Tomorrow.io
    if path:
        task_run_dataform(tags=["tomorrow_io", "silver"])

    print(f"Fluxo Tomorrow.io concluído. Destino: {path}")
    return path


if __name__ == "__main__":
    tomorrow_flow()
