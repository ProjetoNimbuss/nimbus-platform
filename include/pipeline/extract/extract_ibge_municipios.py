import time
import duckdb
import requests

DB_PATH = "include/data/pepluvi.duckdb"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
HEADERS = {"User-Agent": "PEPluvi/1.0"}

def get_coords(municipio: str) -> tuple[float, float] | tuple[None, None]:
    params = {
        "q": f"{municipio}, Pernambuco, Brasil",
        "format": "json",
        "limit": 1,
    }
    try:
        resp = requests.get(NOMINATIM_URL, params=params, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        if data:
            lat = float(data[0]["lat"])
            lon = float(data[0]["lon"])
            return lat, lon
    except Exception as e:
        print(f"Erro ao buscar '{municipio}': {e}")
    return None, None


def main():
    conn = duckdb.connect(DB_PATH)
    conn.execute("CREATE SCHEMA IF NOT EXISTS bronze")

    # Carrega lista de municípios da tabela já existente
    municipios = conn.execute(
        "SELECT codigo_ibge, municipio FROM bronze.ibge_municipios_pe ORDER BY municipio"
    ).fetchall()

    # Prepara tabela de destino
    conn.execute("""
        CREATE OR REPLACE TABLE bronze.municipios_pe_geo (
            codigo_ibge INTEGER PRIMARY KEY,
            municipio VARCHAR,
            latitude DOUBLE,
            longitude DOUBLE
        )
    """)

    total = len(municipios)
    for i, (cod, nome) in enumerate(municipios, 1):
        print(f"[{i:3d}/{total}] Processando {nome}...")
        lat, lon = get_coords(nome)
        if lat is not None:
            conn.execute(
                "INSERT INTO bronze.municipios_pe_geo VALUES (?, ?, ?, ?)",
                (cod, nome, lat, lon),
            )
        else:
            print("    -> NÃO encontrado!")
        time.sleep(1.1)

    conn.close()
    print("Tabela bronze.municipios_pe_geo criada com sucesso.")


if __name__ == "__main__":
    main()
