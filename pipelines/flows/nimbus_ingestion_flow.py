from prefect import flow
from pipelines.flows.cemaden_workflow import cemaden_flow
from pipelines.flows.tomorrow_workflow import tomorrow_flow
from pipelines.flows.open_meteo_workflow import open_meteo_flow
from pipelines.flows.apac_workflow import apac_flow


@flow(name="nimbus-full-ingestion-flow", log_prints=True)
def nimbus_ingestion_flow(include_apac: bool = False):
    """
    Fluxo de ingestão do Nimbus para o Google Cloud Storage.
    """
    print("[NIMBUS] Iniciando ciclo de ingestão de dados para o GCS...")

    # 1. CEMADEN (estações pluviométricas)
    print("-> Executando ingestão CEMADEN...")
    cemaden_flow()

    # 2. Tomorrow.io (nowcasting de 12 horas)
    print("-> Executando ingestão Tomorrow.io...")
    tomorrow_flow()

    # 3. Open-Meteo (tempo presente, previsões e dados marinhos)
    print("-> Executando ingestão Open-Meteo...")
    open_meteo_flow()

    # 4. APAC (histórico de precipitação/ scraping)
    if include_apac:
        print("-> Executando ingestão APAC...")
        apac_flow()

    print("[NIMBUS] Ciclo de ingestão para o GCS concluído com sucesso!")


if __name__ == "__main__":
    nimbus_ingestion_flow()
