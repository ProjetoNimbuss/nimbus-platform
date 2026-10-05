# Guia de Provisionamento e Uso do Taskfile

> **Projeto:** Nimbus — Sistema de Alertas Climáticos da Região Metropolitana do Recife (RMR)  
> **Data:** 25/08/2026  
> **Status:** Tutorial de Inicialização e Automação com Taskfile  

---

## 1. Visão Geral

Este documento orienta o desenvolvedor sobre como provisionar e executar todo o ecossistema do **Nimbus** localmente utilizando o **Taskfile (`go-task`)**.

O Taskfile substitui o antigo `Makefile`, fornecendo automação cross-platform, leitura automática do arquivo `.env` e uma interface de comandos simples para gerenciar a infraestrutura Docker, migrações do Laravel, Data Lake no MinIO, transformações dbt e o orquestrador Prefect.

---

## 2. Instalação da CLI do Taskfile (`go-task`)

Caso ainda não possua o `go-task` instalado na sua máquina:

### 🐧 Linux (Ubuntu / Debian)

```bash
# 1. Remover a ferramenta legada taskwarrior (se existir)
sudo apt remove -y taskwarrior

# 2. Instalar o go-task oficial
sudo sh -c "$(curl -ssL https://taskfile.dev/install.sh)" -- -b /usr/local/bin

# 3. Limpar o cache de executáveis do bash
hash -r
```

### macOS
```bash
brew install go-task/tap/go-task
```

### Verificando a Instalação
No terminal, digite:
```bash
task --version
```
> **Saída esperada:** `Task version: 3.x.x`

---

## 3. Guia de Provisionamento do Projeto do Zero

Siga este passo a passo para subir a infraestrutura completa do Nimbus pela primeira vez:

### Passo 1: Configurar as Variáveis de Ambiente
Copie o modelo `.env.example` para criar o seu arquivo `.env` local:

```bash
cp .env.example .env
```

---

### Passo 2: Executar o Provisionamento Automatizado
Rode o comando master de setup:

```bash
task setup
```

**O que o `task setup` faz automaticamente:**
1. Sobe todos os containers Docker (`docker compose up -d`): MinIO, PostgreSQL, Laravel (API), Next.js (Web), Prefect Server e Prefect Worker.
2. Aguarda a inicialização do MinIO e roda o provisionador dos buckets S3 (`pipeline/storage/setup_minio.py`).
3. Aguarda o PostgreSQL e roda as migrations do banco de dados relacional no Laravel (`php artisan migrate`).

---

### Passo 3: Acompanhar os Logs e Status
Para verificar se todos os containers estão saudáveis:

```bash
# Ver tabela de status dos containers
task status

# Ver logs em tempo real de todos os serviços
task logs
```

---

### Passo 4: Acessar os Serviços Locais

Após o `task setup`, os serviços estarão disponíveis nos seguintes endereços:

| Serviço | Descrição | Endereço Local |
| :--- | :--- | :--- |
| 🌐 **Next.js Dashboard** | Interface web do usuário final | `http://localhost:8080` |
| ⚡ **Laravel REST API** | Backend de rotas e relatos | `http://localhost:8000` |
| 🎛️ **Prefect Server UI** | Painel de controle de pipelines Python | `http://localhost:4200` |
| 🪣 **MinIO Console** | Interface de gerenciamento do Data Lake | `http://localhost:9001` *(User: admin | Pass: minio_secret_123)* |
| 🐘 **PostgreSQL** | Banco relacional | `localhost:5432` *(Database: nimbus_app)* |

---

## 4. Manual de Comandos do Taskfile

Você pode listar todos os comandos executando apenas `task` no terminal:

```bash
task
```

### Docker

| Comando | Descrição |
| :--- | :--- |
| `task up` | Sobe TODOS os serviços Docker em segundo plano (`docker compose up -d`). |
| `task down` | Para e remove todos os containers da aplicação (`docker compose down`). |
| `task restart` | Reinicia todos os containers. |
| `task status` | Exibe a lista de containers ativos e suas portas (`docker compose ps`). |
| `task logs` | Exibe os logs unificados de todos os containers em tempo real. |

### Docker Isolada

| Comando | Descrição |
| :--- | :--- |
| `task up:minio` | Sobe **apenas** o Data Lake (MinIO S3). |
| `task up:postgres` | Sobe **apenas** o Banco Relacional (PostgreSQL). |
| `task up:api` | Sobe **apenas** o Backend (Laravel API). |
| `task up:web` | Sobe **apenas** o Frontend (Next.js). |
| `task up:prefect` | Sobe **apenas** a suíte do Prefect (Server + Worker). |

### Setup

| Comando | Descrição |
| :--- | :--- |
| `task setup` | Roda o setup inicial automatizado (Containers + Buckets MinIO + Migrations). |
| `task setup-storage` | Executa o script Python que cria os buckets S3 no MinIO local (`web-scraping-apac`, `cemaden-api`, etc.). |

### Backend 

| Comando | Descrição |
| :--- | :--- |
| `task migrate` | Executa as migrations do PostgreSQL dentro do container da API. |
| `task seed` | Alimenta o banco PostgreSQL com dados fictícios para desenvolvimento (`db:seed`). |

### Workflow e DBT

| Comando | Descrição |
| :--- | :--- |
| `task dbt-run` | Executa os modelos dbt das camadas Silver e Gold no DuckDB. |
| `task dbt-test` | Executa as suítes de testes de integridade de dados no dbt. |

### Lint

| Comando | Descrição |
| :--- | :--- |
| `task lint` | Executa o linter Ruff nos scripts Python do projeto. |
| `task install` | Instala as dependências Python locais do `requirements.txt` e hooks do pre-commit. |

---

## 5. Fluxo de Trabalho Recomendado

1. **Início do dia:**
   ```bash
   task up
   ```
2. **Caso faça alterações nas migrations do Laravel:**
   ```bash
   task migrate
   ```
3. **Caso queira rodar transformações dbt:**
   ```bash
   task dbt-run
   ```
4. **Fim do dia:**
   ```bash
   task down
   ```
