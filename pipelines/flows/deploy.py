from prefect import deploy, flow


def deploy_all_flows():
    print("[NIMBUS DEPLOY] Preparando deployments para o Prefect Server...")

    # 1. Fluxo Completo de Ingestao (Orquestrador Mestre)
    flow_full = flow.from_source(
        source="/app",
        entrypoint="pipelines/flows/nimbus_ingestion_flow.py:nimbus_ingestion_flow",
    )
    dep_full = flow_full.to_deployment(
        name="nimbus-full-ingestion-hourly",
        cron="0 * * * *",
        tags=["production", "weather", "full", "gcs"],
        description="Ingestão completa de todas as fontes climáticas a cada 1 hora.",
    )

    # 2. Ingestao CEMADEN
    flow_cemaden = flow.from_source(
        source="/app",
        entrypoint="pipelines/flows/cemaden_workflow.py:cemaden_flow",
    )
    dep_cemaden = flow_cemaden.to_deployment(
        name="cemaden-ingestion-15min",
        cron="*/15 * * * *",
        tags=["cemaden", "rainfall", "15min", "gcs"],
        description="Ingestão de dados de estações pluviométricas CEMADEN a cada 15 minutos.",
    )

    # 3. Ingestao Tomorrow.io
    flow_tomorrow = flow.from_source(
        source="/app",
        entrypoint="pipelines/flows/tomorrow_workflow.py:tomorrow_flow",
    )
    dep_tomorrow = flow_tomorrow.to_deployment(
        name="tomorrow-io-hourly",
        cron="0 * * * *",
        tags=["tomorrow-io", "forecast", "hourly", "gcs"],
        description="Nowcasting e previsão meteorológica Tomorrow.io horária.",
    )

    # 4. Ingestao Open-Meteo (Tempo presente, previsões e dados marinhos)
    flow_open_meteo = flow.from_source(
        source="/app",
        entrypoint="pipelines/flows/open_meteo_workflow.py:open_meteo_flow",
    )
    dep_open_meteo = flow_open_meteo.to_deployment(
        name="open-meteo-hourly",
        cron="0 * * * *",
        tags=["open-meteo", "marine", "hourly", "gcs"],
        description="Previsões marinhas e tempo presente Open-Meteo para a RMR.",
    )

    # 5. Ingestao APAC
    flow_apac = flow.from_source(
        source="/app",
        entrypoint="pipelines/flows/apac_workflow.py:apac_flow",
    )
    dep_apac = flow_apac.to_deployment(
        name="apac-scraping-daily",
        cron="0 6 * * *",
        tags=["apac", "scraping", "daily", "gcs"],
        description="Scraping de acumulados pluviométricos da APAC executado diariamente às 06:00.",
    )

    deploy(
        dep_full,
        dep_cemaden,
        dep_tomorrow,
        dep_open_meteo,
        dep_apac,
        work_pool_name="default-agent-pool",
        ignore_warnings=True,
    )

    print("[NIMBUS DEPLOY] Todos os deployments foram registrados com sucesso no Prefect Server!")


if __name__ == "__main__":
    deploy_all_flows()
