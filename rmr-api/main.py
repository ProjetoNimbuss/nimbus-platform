from pathlib import Path
import duckdb
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from contextlib import asynccontextmanager

app = FastAPI(title="Sistema de Alertas Climáticos - RMR", version="1.0.0")

DB_PATH = Path(__file__).parent.parent / "include" / "data" / "pepluvi.duckdb"

# Global connection
global_conn = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global global_conn
    # Inicia uma conexão em memória
    global_conn = duckdb.connect(":memory:")

    # Anexa o banco de dados local existente se existir
    if DB_PATH.exists():
        global_conn.execute(f"ATTACH '{DB_PATH}' AS pepluvi (READ_ONLY)")

    # Cria uma materialized view (tabela em memória) a partir dos parquets do CEMADEN
    # Usando o caminho absoluto baseado no DB_PATH para achar a pasta data
    data_path = DB_PATH.parent.parent.parent / "data" / "raw" / "api_cemaden" / "*" / "*" / "*" / "*.parquet"
    try:
        global_conn.execute(f"""
            CREATE TABLE cemaden_data AS
            SELECT * FROM read_parquet('{data_path}', union_by_name=true)
        """)
        print("Materialized view 'cemaden_data' criada com sucesso.")
    except Exception as e:
        print(f"Erro ao criar materialized view: {e}")

    yield

    # Clean up
    if global_conn:
        global_conn.close()

app.router.lifespan_context = lifespan

# Permite que o frontend (Next.js) faça requisições para a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Na produção, coloque a URL real do frontend, ex: ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    return global_conn

@app.get("/")
def read_root():
    return {"message": "API do Sistema de Alertas Climáticos - RMR operando."}

# ==========================================
# Endpoints usados atualmente pelo Frontend
# ==========================================

@app.get("/api/v1/alertas")
def get_alertas():
    conn = get_db()
    if conn is None:
        # Fallback para mocks se o DB não existir ainda
        agora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        return [
            {"id": 1, "municipio": "Recife", "nivel_alerta": "Atenção 🟡", "atualizacao": agora},
            {"id": 2, "municipio": "Olinda", "nivel_alerta": "Atenção 🟡", "atualizacao": agora},
            {"id": 3, "municipio": "Jaboatão dos Guararapes", "nivel_alerta": "Alerta 🟠", "atualizacao": agora},
        ]

    try:
        # Consulta a camada Gold do dbt convertendo a data para string direto no SQL
        query = "SELECT id, municipio, nivel_alerta, CAST(atualizacao AS VARCHAR) as atualizacao FROM pepluvi.gold.gold_grid_risk ORDER BY id"
        res = conn.execute(query)
        columns = [desc[0] for desc in res.description]
        return [dict(zip(columns, row)) for row in res.fetchall()]
    except duckdb.CatalogException:
        # Caso a tabela gold_grid_risk não exista ainda
        return [{"id": 0, "municipio": "Erro", "nivel_alerta": "Tabela gold não encontrada", "atualizacao": ""}]
    except Exception as e:
        return [{"id": 0, "municipio": "Erro Interno", "nivel_alerta": str(e), "atualizacao": ""}]

# ==========================================
# Endpoints da Etapa 2 (Planejados)
# ==========================================

@app.get("/api/v1/grid")
def get_grid():
    return {"message": "Lista de 48 células com coordenadas, nível de alerta atual e índice de risco."}

@app.get("/api/v1/grid/{cell_id}/risk")
def get_grid_risk(cell_id: int):
    return {"cell_id": cell_id, "message": "Detalhamento do índice de risco (variáveis e pesos)."}

@app.get("/api/v1/grid/{cell_id}/population")
def get_grid_population(cell_id: int):
    return {"cell_id": cell_id, "message": "População exposta na célula."}

@app.get("/api/v1/rivers/levels")
def get_rivers_levels():
    return {"message": "Cotas atuais dos 3 rios monitorados."}

@app.get("/api/v1/tides/current")
def get_tides_current():
    return {"message": "Tábua de marés atual do Porto do Recife."}

@app.get("/api/v1/municipalities/{municipality_id}/risk")
def get_municipality_risk(municipality_id: int):
    return {"municipality_id": municipality_id, "message": "Risco agregado por município."}

# ==========================================
# Endpoints CEMADEN (Integração Parquet)
# ==========================================

@app.get("/api/v1/stations")
def get_stations():
    conn = get_db()
    if conn is None:
        return []

    try:
        # Retorna as estações únicas disponíveis nos dados materializados
        query = """
            SELECT DISTINCT codigo_gmmc as id, nome_estacao as nome, cidade, latitude, longitude
            FROM cemaden_data
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        """
        res = conn.execute(query)
        columns = [desc[0] for desc in res.description]
        return [dict(zip(columns, row)) for row in res.fetchall()]
    except Exception as e:
        return [{"error": str(e)}]

@app.get("/api/v1/stations/{station_id}/precipitation")
def get_station_precipitation(station_id: str):
    conn = get_db()
    if conn is None:
        return []

    try:
        # Retorna a série de precipitação ordenada para a estação solicitada convertendo data para string
        query = f"""
            SELECT CAST(data_hora AS VARCHAR) as data_hora, chuva
            FROM cemaden_data
            WHERE codigo_gmmc = '{station_id}'
            ORDER BY data_hora ASC
        """
        res = conn.execute(query)
        columns = [desc[0] for desc in res.description]
        return [dict(zip(columns, row)) for row in res.fetchall()]
    except Exception as e:
        return [{"error": str(e)}]

