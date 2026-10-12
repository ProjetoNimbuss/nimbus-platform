from prefect import flow, task

from pipelines.extract.extract_open_meteo_current import (
    fetch_current,
    save_to_gcs as save_current,
)
from pipelines.extract.extract_open_meteo_daily import (
    fetch_daily,
    save_to_gcs as save_daily,
)
from pipelines.extract.extract_open_meteo_hourly import (
    fetch_hourly,
    save_to_gcs as save_hourly,
)
from pipelines.extract.extract_open_meteo_marine_current import (
    fetch_marine_current,
    save_to_gcs as save_marine_current,
)
from pipelines.extract.extract_open_meteo_marine_daily import (
    fetch_marine_daily,
    save_to_gcs as save_marine_daily,
)
from pipelines.extract.extract_open_meteo_marine_hourly import (
    fetch_marine_hourly,
    save_to_gcs as save_marine_hourly,
)


@task(name="ingest-weather-current", retries=3, retry_delay_seconds=30)
def task_weather_current():
    df = fetch_current()
    return save_current(df)


@task(name="ingest-weather-daily", retries=3, retry_delay_seconds=30)
def task_weather_daily():
    df = fetch_daily()
    return save_daily(df)


@task(name="ingest-weather-hourly", retries=3, retry_delay_seconds=30)
def task_weather_hourly():
    df = fetch_hourly()
    return save_hourly(df)


@task(name="ingest-marine-current", retries=3, retry_delay_seconds=30)
def task_marine_current():
    df = fetch_marine_current()
    return save_marine_current(df)


@task(name="ingest-marine-daily", retries=3, retry_delay_seconds=30)
def task_marine_daily():
    df = fetch_marine_daily()
    return save_marine_daily(df)


@task(name="ingest-marine-hourly", retries=3, retry_delay_seconds=30)
def task_marine_hourly():
    df = fetch_marine_hourly()
    return save_marine_hourly(df)


@flow(name="open-meteo-weather-flow", log_prints=True)
def open_meteo_weather_flow():
    """Fluxo para dados meteorológicos terrestres Open-Meteo diretamente no GCS."""
    task_weather_current()
    task_weather_daily()
    task_weather_hourly()


@flow(name="open-meteo-marine-flow", log_prints=True)
def open_meteo_marine_flow():
    """Fluxo para dados oceanográficos costeiros Open-Meteo diretamente no GCS."""
    task_marine_current()
    task_marine_daily()
    task_marine_hourly()


@flow(name="open-meteo-full-flow", log_prints=True)
def open_meteo_flow():
    """Fluxo integrado Open-Meteo (terrestre e costeiro)."""
    print("Iniciando ingestão Open-Meteo...")
    open_meteo_weather_flow()
    open_meteo_marine_flow()
    print("Ingestão Open-Meteo concluída com sucesso no GCS.")


if __name__ == "__main__":
    open_meteo_flow()
