from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta
import sys
import os

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "include", "pipeline", "extract"))
DBT_DIR = os.path.join(PROJECT_ROOT, "transform")

# Importamos as funções do script renomeado
from extract_cemaden import fetch_data, save_partitioned, update_bronze_view  # noqa: E402

default_args = {
    'owner': 'pepluvi',
    'depends_on_past': False,
    'start_date': datetime(2026, 5, 2),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=1),
}

def task_extract():
    """Tarefa 1: Coleta da API e salva em Parquet (Raw particionado)"""
    df = fetch_data()
    path = save_partitioned(df)
    return path

def task_update_view():
    """Tarefa 2: Garante que a VIEW data_cemaden existe e aponta para a Raw"""
    update_bronze_view()

with DAG(
    dag_id='dag_cemaden_realtime',
    default_args=default_args,
    description='Pipeline Real-Time: Extração API CEMADEN → Bronze → Silver → Gold',
    schedule='*/15 * * * *',
    catchup=False,
    max_active_runs=1,
    tags=['cemaden', 'api', 'real-time'],
) as dag:

    extrair = PythonOperator(
        task_id='extrair_salvar_raw',
        python_callable=task_extract,
    )

    atualizar_view = PythonOperator(
        task_id='atualizar_view_bronze',
        python_callable=task_update_view,
    )

    dbt_run_cemaden = BashOperator(
        task_id='dbt_run_cemaden',
        bash_command=f'cd {DBT_DIR} && dbt run --select tag:cemaden',
    )

    dbt_test_cemaden = BashOperator(
        task_id='dbt_test_cemaden',
        bash_command=f'cd {DBT_DIR} && dbt test --select tag:cemaden',
    )

    extrair >> atualizar_view >> dbt_run_cemaden >> dbt_test_cemaden

