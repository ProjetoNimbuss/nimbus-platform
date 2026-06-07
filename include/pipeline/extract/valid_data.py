import pandas as pd
import re
import sys
import os

# Adiciona o diretório raiz ao PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from config.settings import RAW_DIR

DIR_DADOS = RAW_DIR

def valid_data(caminho_arquivo):
    try:
        df = pd.read_csv(caminho_arquivo)
    except Exception as e:
        return f"Erro ao abrir ({e})"

    # 1. Extrair ano do nome do arquivo
    match = re.search(r'_(\d{4})\.csv', caminho_arquivo.name)
    if not match:
        return "Ano não identificado no nome do arquivo"

    ano_arquivo = int(match.group(1))

    # 2. Validar se a coluna existe
    if 'ano_ref' not in df.columns:
        return "Coluna 'ano_ref' ausente"

    # 3. Bater o ano interno com o do nome
    anos_internos = df['ano_ref'].dropna().unique()

    if len(anos_internos) == 0:
        return "Coluna 'ano_ref' sem valores válidos"

    if len(anos_internos) > 1 or anos_internos[0] != ano_arquivo:
        return f"INCONSISTÊNCIA! Nome={ano_arquivo}, Dados={list(anos_internos)}"

    return None

def main():
    if not DIR_DADOS.exists():
        print(f'Pasta {DIR_DADOS} não encontrada')
        return

    arquivos = sorted(DIR_DADOS.glob('*.csv'))
    if not arquivos:
        print('Pasta vazia')
        return

    total = len(arquivos)
    erros = []

    print(f"Analisando {total} arquivos...\n" + "-" * 50)

    for arquivo in arquivos:
        motivo = valid_data(arquivo)
        if motivo:
            erros.append((arquivo.name, motivo))
            print(f"{arquivo.name}: {motivo}")
        else:
            print(f"{arquivo.name}")

    # Resumo
    print("\n" + "=" * 50)
    ok = total - len(erros)
    print(f"RESULTADO: {ok}/{total} válidos — {len(erros)} com erro")

    if erros:
        print(f"\nArquivos com problema ({len(erros)}):")
        print("-" * 50)
        for nome, motivo in erros:
            print(f"{nome}: {motivo}")


if __name__ == '__main__':
    main()
