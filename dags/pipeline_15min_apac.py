from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import sys
import os

# Ajusta sys.path para importar o script de extração
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "include", "pipeline", "extract"))

# Importamos as funções do script agora que o sys.path está correto
from dados_15min_apac import fetch_data, save_partitioned, update_bronze_view  # noqa: E402

default_args = {
    'owner': 'pepluvi',
    'depends_on_past': False,
    'start_date': datetime(2026, 5, 2),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

def task_extract():
    """Tarefa 1: Coleta da API e salva em Parquet (Raw particionado)"""
    df = fetch_data()
    path = save_partitioned(df)
    return path

def task_update_view():
    """Tarefa 2: Garante que a VIEW apac_15min_bronze existe e aponta para a Raw"""
    update_bronze_view()

with DAG(
    dag_id='pipeline_15min_apac',
    default_args=default_args,
    description='Pipeline 15 min: Extração API CEMADEN e View Bronze',
    schedule='*/15 * * * *',
    catchup=False,
    max_active_runs=1,
    tags=['api', 'real-time', 'bronze'],
) as dag:

    extrair = PythonOperator(
        task_id='extrair_salvar_raw',
        python_callable=task_extract,
    )

    atualizar_view = PythonOperator(
        task_id='atualizar_view_bronze',
        python_callable=task_update_view,
    )

    extrair >> atualizar_view
