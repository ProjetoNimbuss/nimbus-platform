"""
Script de Deploy de Fluxos no Prefect Server (Prefect 3)
Registra os deployments para os workflows climaticos independentes do Nimbus
no work pool default-agent-pool.
"""
from prefect import deploy, flow


def deploy_all_flows():
    print("[NIMBUS DEPLOY] Preparando deployments independentes para o Prefect Server...")

    # 1. Ingestao CEMADEN (Alta frequencia - Estacoes pluviometricas)
    flow_cemaden = flow.from_source(
        source="/app",
        entrypoint="pipelines/flows/cemaden_workflow.py:cemaden_flow",
    )
    dep_cemaden = flow_cemaden.to_deployment(
        name="cemaden-ingestion-15min",
        cron="*/15 * * * *",
        tags=["cemaden", "rainfall", "15min", "gcs"],
        description="Ingestao de dados de estacoes pluviometricas CEMADEN a cada 15 minutos.",
    )

    # 2. Ingestao Tomorrow.io (Nowcasting 12h)
    flow_tomorrow = flow.from_source(
        source="/app",
        entrypoint="pipelines/flows/tomorrow_workflow.py:tomorrow_flow",
    )
    dep_tomorrow = flow_tomorrow.to_deployment(
        name="tomorrow-io-hourly",
        cron="0 * * * *",
        tags=["tomorrow-io", "forecast", "hourly", "gcs"],
        description="Nowcasting e previsao meteorologica Tomorrow.io horaria.",
    )

    # 3. Ingestao Open-Meteo (Tempo presente, previsoes e dados marinhos)
    flow_open_meteo = flow.from_source(
        source="/app",
        entrypoint="pipelines/flows/open_meteo_workflow.py:open_meteo_flow",
    )
    dep_open_meteo = flow_open_meteo.to_deployment(
        name="open-meteo-hourly",
        cron="0 * * * *",
        tags=["open-meteo", "marine", "hourly", "gcs"],
        description="Previsoes marinhas e tempo presente Open-Meteo para a RMR a cada 1 hora.",
    )

    # 4. Ingestao APAC (Scraping com Chrome headless)
    flow_apac = flow.from_source(
        source="/app",
        entrypoint="pipelines/flows/apac_workflow.py:apac_flow",
    )
    dep_apac = flow_apac.to_deployment(
        name="apac-scraping-daily",
        cron="0 6 * * *",
        tags=["apac", "scraping", "daily", "gcs"],
        description="Scraping de acumulados pluviometricos da APAC executado diariamente as 06:00.",
    )

    # Registra apenas os fluxos modulares desacoplados
    deploy(
        dep_cemaden,
        dep_tomorrow,
        dep_open_meteo,
        dep_apac,
        work_pool_name="default-agent-pool",
        ignore_warnings=True,
    )

    print("[NIMBUS DEPLOY] Todos os deployments independentes foram registrados com sucesso!")


if __name__ == "__main__":
    deploy_all_flows()
