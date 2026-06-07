from pathlib import Path
import duckdb
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

app = FastAPI(title="Sistema de Alertas Climáticos - RMR", version="1.0.0")

# Permite que o frontend (Next.js) faça requisições para a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Na produção, coloque a URL real do frontend, ex: ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = Path(__file__).parent.parent / "include" / "data" / "pepluvi.duckdb"

def get_db():
    if not DB_PATH.exists():
        return None
    return duckdb.connect(str(DB_PATH), read_only=True)

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
        # Consulta a camada Gold do dbt
        df = conn.execute("SELECT id, municipio, nivel_alerta, atualizacao FROM gold.gold_grid_risk ORDER BY id").df()

        # Converter atualizacao para string para serialização JSON
        df['atualizacao'] = df['atualizacao'].astype(str)

        return df.to_dict(orient="records")
    except duckdb.CatalogException:
        # Caso a tabela gold_grid_risk não exista ainda
        return [{"id": 0, "municipio": "Erro", "nivel_alerta": "Tabela gold não encontrada", "atualizacao": ""}]
    except Exception as e:
        return [{"id": 0, "municipio": "Erro Interno", "nivel_alerta": str(e), "atualizacao": ""}]
    finally:
        conn.close()

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
