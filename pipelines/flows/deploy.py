"""
Script de Deploy de Fluxos no Prefect Server (Prefect 3)
Registra os deployments para os workflows climaticos independentes do Nimbus
no work pool default-agent-pool.
"""
from prefect import deploy, flow


def deploy_all_flows():
    print("[NIMBUS DEPLOY] Preparando deployments independentes para o Prefect Server...")

    # 1. Ingestao CEMADEN (Estacoes pluviometricas + Silver)
    flow_cemaden = flow.from_source(
        source="/app",
        entrypoint="pipelines/flows/cemaden_workflow.py:cemaden_flow",
    )
    dep_cemaden = flow_cemaden.to_deployment(
        name="cemaden-ingestion-hourly",
        cron="0 * * * *",
        tags=["cemaden", "rainfall", "hourly", "gcs"],
        description="Ingestao de dados de estacoes pluviometricas CEMADEN e transformacao Silver horaria.",
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

    # 5. Camada Gold - Situacao Atual em Tempo Real (CEMADEN)
    flow_gold_tempo_real = flow.from_source(
        source="/app",
        entrypoint="pipelines/flows/gold_workflow.py:gold_tempo_real_flow",
    )
    dep_gold_tempo_real = flow_gold_tempo_real.to_deployment(
        name="gold-tempo-real-hourly",
        cron="10 * * * *",
        tags=["gold", "tempo_real", "hourly", "dataform"],
        description="Consolidacao Gold de situacao atual por estacao e municipio a cada 1 hora.",
    )

    # 6. Camada Gold - Previsoes Climaticas Consolidadas (ECMWF, GFS, Tomorrow)
    flow_gold_previsao = flow.from_source(
        source="/app",
        entrypoint="pipelines/flows/gold_workflow.py:gold_previsao_flow",
    )
    dep_gold_previsao = flow_gold_previsao.to_deployment(
        name="gold-previsao-6h",
        cron="15 0,6,12,18 * * *",
        tags=["gold", "previsao", "6h", "dataform"],
        description="Consolidacao Gold de previsoes horarias (48h) e diarias (7d) a cada 6 horas.",
    )

    # Registra todos os fluxos modulares desacoplados
    deploy(
        dep_cemaden,
        dep_tomorrow,
        dep_open_meteo,
        dep_apac,
        dep_gold_tempo_real,
        dep_gold_previsao,
        work_pool_name="default-agent-pool",
        ignore_warnings=True,
    )

    print("[NIMBUS DEPLOY] Todos os deployments independentes foram registrados com sucesso!")


if __name__ == "__main__":
    deploy_all_flows()
