"""
Fluxo Prefect para execução desacoplada dos modelos analíticos da Camada Gold no BigQuery.
Garante que as tabelas de negócio e dashboards sejam atualizadas em cadência controlada,
sem gerar execuções concorrentes ou custos desnecessários a cada ingestão de dados brutos.
"""

from prefect import flow
from pipelines.flows.tasks.dataform_task import task_run_dataform


@flow(name="gold-tempo-real-flow", log_prints=True)
def gold_tempo_real_flow():
    """Atualiza as tabelas Gold de situação em tempo real (CEMADEN) a cada 1 hora."""
    print("[GOLD] Iniciando atualização de situação atual em tempo real...")
    result = task_run_dataform(tags=["gold", "tempo_real"])
    print("[GOLD] Tabelas Gold de tempo real atualizadas com sucesso.")
    return result


@flow(name="gold-previsao-flow", log_prints=True)
def gold_previsao_flow():
    """Atualiza as tabelas Gold de previsão climática consolidada (ECMWF, GFS, Tomorrow) a cada 6 horas."""
    print("[GOLD] Iniciando consolidação das previsões climáticas Gold...")
    result = task_run_dataform(tags=["gold", "previsao"])
    print("[GOLD] Tabelas Gold de previsão climática atualizadas com sucesso.")
    return result


if __name__ == "__main__":
    gold_tempo_real_flow()
    gold_previsao_flow()
