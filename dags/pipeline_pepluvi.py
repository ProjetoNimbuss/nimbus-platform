from airflow import DAG
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta
import os

default_args = {
    'owner': 'igor.tiburcio',
    'depends_on_past': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

PROJETO_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'include')
DBT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'transform')

with DAG(
    'pipeline_pepluvi',
    default_args=default_args,
    description='DAG para o pipeline PEPluvi (Carga Incremental D-1)',
    schedule='0 6 * * *',
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=['pepluvi'],
) as dag:

    task_limpa_parquet = BashOperator(
        task_id='limpa_parquet',
        bash_command='cd ' + PROJETO_DIR + ' && rm -f data/raw/*_{{ macros.ds_format(ds, "%Y-%m-%d", "%Y") }}.parquet'
    )

    task_scraping = BashOperator(
        task_id='scraping',
        bash_command=f'cd {PROJETO_DIR} && python pipeline/extract/scraping_apac.py'
    )

    task_validacao = BashOperator(
        task_id='validacao_integridade',
        bash_command=f'cd {PROJETO_DIR} && python pipeline/extract/valid_data.py'
    )

    task_ingestao = BashOperator(
        task_id='ingestao_duckdb',
        bash_command='cd ' + PROJETO_DIR + ' && python pipeline/load/ingest_duckdb.py {{ macros.ds_format(ds, "%Y-%m-%d", "%Y") }}'
    )

    task_dbt_run_silver = BashOperator(
        task_id='dbt_run_silver',
        bash_command=f'cd {DBT_DIR} && dbt run --select silver'
    )

    task_dbt_test_silver = BashOperator(
        task_id='dbt_test_silver',
        bash_command=f'cd {DBT_DIR} && dbt test --select silver'
    )

    task_dbt_run_gold = BashOperator(
        task_id='dbt_run_gold',
        bash_command=f'cd {DBT_DIR} && dbt run --select gold'
    )

    task_dbt_test_gold = BashOperator(
        task_id='dbt_test_gold',
        bash_command=f'cd {DBT_DIR} && dbt test --select gold'
    )

    (
        task_limpa_parquet
        >> task_scraping
        >> task_validacao
        >> task_ingestao
        >> task_dbt_run_silver
        >> task_dbt_test_silver
        >> task_dbt_run_gold
        >> task_dbt_test_gold
    )