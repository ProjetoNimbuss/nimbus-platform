"""
Task Prefect para execução dos modelos SQLX no BigQuery via Dataform CLI.
"""

import subprocess
from pathlib import Path
from prefect import task


def get_dataform_dir() -> str:
    """Retorna o caminho do diretório dataform (seja no container /app ou local)."""
    container_dir = Path("/app/dataform")
    if container_dir.exists():
        return str(container_dir)

    # Caminho relativo ao projeto local
    current_dir = Path(__file__).resolve().parent.parent.parent.parent
    local_dir = current_dir / "dataform"
    if local_dir.exists():
        return str(local_dir)

    return "dataform"


@task(name="run-dataform-silver", retries=2, retry_delay_seconds=30)
def task_run_dataform(tags: list[str] = None) -> str:
    """
    Executa a compilação e transformação dos modelos no BigQuery via Dataform CLI.
    Permite filtrar por tags para rodar apenas os modelos pertinentes.
    """
    df_dir = get_dataform_dir()
    tag_arg = f"--tags {','.join(tags)}" if tags else ""
    cmd = f"dataform run {df_dir} {tag_arg}".strip()

    print(f"[DATAFORM CLI] Disparando execução: {cmd}")
    result = subprocess.run(
        cmd,
        shell=True,
        capture_output=True,
        text=True,
        cwd=df_dir,
    )

    if result.returncode != 0:
        print(f"[DATAFORM ERRO] Falha na compilação ou execução no BigQuery:\n{result.stderr}")
        raise RuntimeError(f"Dataform CLI falhou com código {result.returncode}: {result.stderr}")

    print(f"[DATAFORM SUCESSO]\n{result.stdout}")
    return result.stdout
