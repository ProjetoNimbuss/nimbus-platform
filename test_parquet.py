import duckdb
import sys

path1 = 'C:/Users/Engis/OneDrive/Documentos/Projetos/rmr-alertas/data/raw/Metropolitana_Recife_2026.parquet'

try:
    conn = duckdb.connect()
    print("--- SCHEMA REGIONAL ---")
    desc = conn.execute(f"DESCRIBE SELECT * FROM '{path1}'").fetchall()
    for col in desc:
        print(col)
        
    print("\n--- DATA REGIONAL ---")
    data = conn.execute(f"SELECT * FROM '{path1}' LIMIT 5").fetchall()
    for row in data:
        print(row)

except Exception as e:
    print(f"Error: {e}")
