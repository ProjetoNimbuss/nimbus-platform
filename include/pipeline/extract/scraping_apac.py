import time
import re
import logging
from datetime import date
from pathlib import Path
import pandas as pd
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from io import StringIO
import sys
import os

# Adiciona o diretório raiz ao PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from config.settings import BASE_URL, RAW_DIR

OUTPUT_DIR = RAW_DIR
LOG_FILE = Path(__file__).resolve().parent / "scraper.log"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    handlers=[logging.FileHandler(LOG_FILE, encoding="utf-8"), logging.StreamHandler()],
)
log = logging.getLogger(__name__)

MESORREGIOES = {
    2605: "Metropolitana_Recife",
    2604: "Mata_Pernambucana",
    2603: "Agreste_Pernambucano",
    2602: "Sao_Francisco_Pernambucano",
    2601: "Sertao_Pernambucano",
}

# Colunas obrigatórias que a tabela de dados real deve conter
COLUNAS_ESPERADAS = ["Código", "Posto", "Mês/Ano"]


class ScraperAPAC:
    def __init__(self, headless: bool = False):
        options = webdriver.ChromeOptions()
        if headless:
            options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-blink-features=AutomationControlled")

        self.driver = webdriver.Chrome(options=options)
        self.wait = WebDriverWait(self.driver, 20)

    def acessar_pagina(self):
        log.info(f"Acessando {BASE_URL}")
        self.driver.get(BASE_URL)
        time.sleep(5)

    def selecionar_mesorregiao(self, cod_id: int):
        """Seleciona uma única mesorregião no dropdown multiselect."""
        try:
            btn_dropdown = self.wait.until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(@class, 'ui-multiselect')]"))
            )
            btn_dropdown.click()
            time.sleep(1)

            # Desmarca todas as opções primeiro
            try:
                btn_uncheck = self.driver.find_element(By.XPATH, "//a[contains(@class, 'ui-multiselect-none')]")
                btn_uncheck.click()
            except Exception:
                self.driver.execute_script(
                    "document.querySelectorAll('input[name=\"multiselect_pmesorregiao\"]')"
                    ".forEach(i => i.checked = false);"
                )

            # Marca a mesorregião desejada
            checkbox = self.driver.find_element(
                By.XPATH, f"//input[@name='multiselect_pmesorregiao' and @value='{cod_id}']"
            )
            self.driver.execute_script("arguments[0].click();", checkbox)

            # Fecha o dropdown
            btn_dropdown.click()
            time.sleep(0.5)
            log.info(f"  Mesorregião {cod_id} selecionada.")
        except Exception as e:
            log.error(f"Erro ao selecionar mesorregião {cod_id}: {e}")
            raise

    def definir_datas(self, d_ini: str, d_fim: str):
        """Preenche datas via JS disparando os eventos necessários para validação do site."""
        try:
            # Limpa e preenche com eventos completos (change, input, blur)
            script = f"""
                var ini = document.getElementById('dataInicial');
                var fim = document.getElementById('dataFinal');
                ini.value = '{d_ini}';
                fim.value = '{d_fim}';
                ini.dispatchEvent(new Event('change', {{bubbles: true}}));
                ini.dispatchEvent(new Event('input', {{bubbles: true}}));
                ini.dispatchEvent(new Event('blur', {{bubbles: true}}));
                fim.dispatchEvent(new Event('change', {{bubbles: true}}));
                fim.dispatchEvent(new Event('input', {{bubbles: true}}));
                fim.dispatchEvent(new Event('blur', {{bubbles: true}}));
            """
            self.driver.execute_script(script)
            time.sleep(0.5)
            log.info(f"  Datas definidas: {d_ini} a {d_fim}")
        except Exception as e:
            log.error(f"Erro ao preencher datas via JS: {e}")
            raise

    def pesquisar_e_extrair(self, ano_esperado: int) -> pd.DataFrame:
        try:
            # 1. Clique no botão Pesquisar
            btn = self.driver.find_element(By.ID, "btPesquisaPluvio")
            self.driver.execute_script("arguments[0].click();", btn)

            # 2. Lida com Alertas do site
            try:
                WebDriverWait(self.driver, 3).until(EC.alert_is_present())
                alerta = self.driver.switch_to.alert
                log.warning(f"  Alerta do site: {alerta.text}")
                alerta.accept()
                return pd.DataFrame()
            except TimeoutException:
                pass

            # 3. ESPERA INTELIGENTE (Smart Polling)
            tempo_maximo = 120
            inicio = time.time()

            while time.time() - inicio < tempo_maximo:
                try:
                    html = self.driver.page_source
                    soup = BeautifulSoup(html, "html.parser")
                    tabela = soup.find("table", {"id": "tbMonPluvio"})

                    if tabela:
                        html_io = StringIO(str(tabela))
                        # header=0 garante que ele vai achar a coluna "Código"
                        dfs = pd.read_html(html_io, decimal=",", thousands=".", header=0)

                        if dfs:
                            df = dfs[0]
                            # Verifica se a tabela já possui a coluna Mês/Ano
                            if "Mês/Ano" in df.columns:
                                # Transforma a coluna em texto contínuo
                                texto_datas = " ".join(df["Mês/Ano"].dropna().astype(str))

                                #só aceita se o ano pedido aparece na tabela
                                if str(ano_esperado) in texto_datas:

                                    # Limpeza de colunas
                                    df.columns = [str(c).strip() for c in df.columns]
                                    colunas_presentes = [col for col in COLUNAS_ESPERADAS if col in df.columns]
                                    if len(colunas_presentes) < len(COLUNAS_ESPERADAS):
                                        return pd.DataFrame()

                                    # Limpeza de dados inválidos
                                    df["Código"] = pd.to_numeric(df["Código"], errors="coerce")
                                    df = df.dropna(subset=["Código"])
                                    df["Código"] = df["Código"].astype(int)

                                    if df.empty:
                                        return pd.DataFrame()

                                    # Passa na trava final de segurança
                                    df = self._validar_ano(df, ano_esperado)
                                    return df
                except Exception:
                    pass

                time.sleep(1) # Aguarda 1 segundo antes de olhar a tela de novo

            log.warning(f"  Timeout: O site não carregou dados de {ano_esperado} a tempo ou o ano está vazio.")
            return pd.DataFrame()

        except Exception as e:
            log.warning(f"  Erro na extração: {e}")
            return pd.DataFrame()

    def _validar_ano(self, df: pd.DataFrame, ano_esperado: int) -> pd.DataFrame:
        """
        Valida que os dados retornados pertencem ao ano solicitado.
        Remove linhas cujo Mês/Ano não corresponde ao ano_esperado.
        """
        if "Mês/Ano" not in df.columns:
            log.warning("  Coluna 'Mês/Ano' ausente, não é possível validar o ano.")
            return df

        def extrair_ano(mes_ano_str):
            """Extrai o ano de strings como 'jan/2025', 'fev/1961', etc."""
            try:
                match = re.search(r"/(\d{4})", str(mes_ano_str))
                if match:
                    return int(match.group(1))
            except Exception:
                pass
            return None

        df = df.copy()
        df["_ano_extraido"] = df["Mês/Ano"].apply(extrair_ano)

        # Contagem de anos encontrados para log
        anos_encontrados = df["_ano_extraido"].dropna().unique()
        if len(anos_encontrados) == 0:
            log.warning("  Não foi possível identificar o formato de ano na coluna 'Mês/Ano'. Descartando.")
            return pd.DataFrame() # Rejeita!

        # Se achou os anos, continua a lógica original
        anos_str = ", ".join(str(int(a)) for a in sorted(anos_encontrados))
        if ano_esperado not in anos_encontrados:
            log.warning(f"  INCONSISTÊNCIA: Ano esperado={ano_esperado}, vieram [{anos_str}]. Descartando TODOS.")
            return pd.DataFrame()

        df = df[df["_ano_extraido"] == ano_esperado]
        df = df.drop(columns=["_ano_extraido"])
        return df

    def fechar(self):
        self.driver.quit()


# Main
def main():
    ano_inicio = 1961
    ano_fim = date.today().year
    scraper = ScraperAPAC(headless=True)

    try:
        for cod_id, nome_meso in MESORREGIOES.items():
            log.info(f"\n>>> PROCESSANDO: {nome_meso} (ID: {cod_id})")

            # Recarregar a página para cada mesorregião
            scraper.acessar_pagina()

            # Seleciona a mesorregião UMA VEZ
            scraper.selecionar_mesorregiao(cod_id)

            for ano in range(ano_inicio, ano_fim + 1):
                arquivo_parquet = OUTPUT_DIR / f"{nome_meso}_{ano}.parquet"
                if arquivo_parquet.exists():
                    continue

                d_ini = f"01/01/{ano}"
                d_fim = f"31/12/{ano}" if ano < ano_fim else date.today().strftime("%d/%m/%Y")

                try:
                    # mesorregião já selecionada, agora define datas
                    scraper.definir_datas(d_ini, d_fim)

                    # Pesquisa e extrai validação do ano
                    df = scraper.pesquisar_e_extrair(ano_esperado=ano)

                    if not df.empty:
                        df["mesorregiao_id"] = cod_id
                        df["ano_ref"] = ano
                        df.to_parquet(arquivo_parquet, index=False)
                        log.info(f"  [OK] {ano}: {len(df)} registros salvos.")
                    else:
                        log.warning(f"  [!] {ano}: Sem dados válidos para este ano.")

                    time.sleep(1)

                except Exception as e:
                    log.error(f"Falha no ano {ano}: {e}")
                    # Em caso de erro, recarrega a página e reseleciona mesorregião
                    try:
                        scraper.acessar_pagina()
                        scraper.selecionar_mesorregiao(cod_id)
                    except Exception as e2:
                        log.error(f"Falha ao recuperar após erro: {e2}")
                    time.sleep(2)

    finally:
        scraper.fechar()


if __name__ == "__main__":
    main()
