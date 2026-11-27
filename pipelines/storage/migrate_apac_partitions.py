"""
Script de Migração dos Arquivos Históricos da APAC no GCS para Hive Partitioning.

Converte arquivos planos legados:
  gs://<bucket>/<Mesorregiao>_<Ano>.parquet
Para a estrutura particionada:
  gs://<bucket>/ano=<Ano>/<Mesorregiao>.parquet

Permite execução em modo --dry-run (apenas lista as operações sem mover).
"""

import re
import argparse
import gcsfs
from pipelines.config.settings import BUCKETS


def migrar_particoes_apac(dry_run: bool = False):
    bucket = BUCKETS.get("apac")
    fs = gcsfs.GCSFileSystem()

    print(f"[MIGRAÇÃO APAC] Listando arquivos em gs://{bucket}/...")
    arquivos = fs.ls(bucket)

    padrao = re.compile(rf"^{bucket}/([A-Za-z_]+)_(\d{{4}})\.parquet$")
    migrados = 0
    ignorados = 0

    for item in arquivos:
        match = padrao.match(item)
        if match:
            mesorregiao, ano = match.groups()
            origem = f"gs://{item}"
            destino = f"gs://{bucket}/ano={ano}/{mesorregiao}.parquet"

            if dry_run:
                print(f"[DRY-RUN] Copiaria: {origem} -> {destino}")
            else:
                print(f"[MIGRANDO] {origem} -> {destino}")
                fs.copy(item, f"{bucket}/ano={ano}/{mesorregiao}.parquet")
            migrados += 1
        else:
            ignorados += 1

    print(f"\n[MIGRAÇÃO APAC] Concluído! Total identificados para migração: {migrados}. Ignorados/já particionados: {ignorados}.")
    if dry_run:
        print("[MIGRAÇÃO APAC] Modo dry-run: nenhuma alteração foi realizada no GCS.")
    else:
        print("[MIGRAÇÃO APAC] Arquivos copiados para as novas pastas ano=YYYY/ com sucesso.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migração de arquivos da APAC para Hive Partitioning no GCS.")
    parser.add_argument("--dry-run", action="store_true", help="Apenas simula a migração sem copiar arquivos.")
    args = parser.parse_args()

    migrar_particoes_apac(dry_run=args.dry_run)
