# Nimbus Dataform — Modelagem Analítica no Google Cloud (BigQuery)

Este diretório contém a estrutura de configuração e os modelos **SQLX** do **Google Cloud Dataform**, responsáveis pela camada de transformação de dados em produção (**Bronze ➔ Silver ➔ Gold**) diretamente no **Google BigQuery**.

---

## Estrutura de Diretórios

```
dataform/
├── workflow_settings.yaml     # Configuração principal (projeto GCP, região e datasets padrão)
├── package.json               # Dependências do Dataform Core (@dataform/core)
├── definitions/               # Lógica de transformação analítica (SQLX)
│   ├── bronze/                # Declarações de tabelas externas (Parquet do GCS no BigQuery)
│   ├── silver/                # Limpeza, deduplicação e padronização dos dados
│   └── gold/                  # Agregações analíticas, janelas de chuva e métricas finais
├── includes/                  # Funções JavaScript auxiliares compartilhadas entre modelos
└── README.md                  # Documentação do Dataform e integração com o GitHub
```

---

## Como Adicionar Novos Modelos (`.sqlx`)

Cada modelo no Dataform segue a anatomia:

```sql
config {
  type: "table",               -- "table", "view" ou "incremental"
  schema: "nimbus_silver",     -- Dataset de destino no BigQuery
  tags: ["fonte", "camada"],   -- Tags para execuções parciais
  description: "Descrição da tabela para o catálogo de dados do BigQuery"
}

SELECT
  coluna_a,
  coluna_b
FROM ${ref("nome_da_tabela_origem")}
```

- **Para declarar fontes externas brutas do GCS (Bronze):** Use arquivos `.js` dentro de `definitions/bronze/` com `declare({ schema: "nimbus_bronze", name: "tabela_bruta" })`.
- **Para criar dependências:** Use `${ref("nome_da_tabela")}`. O Dataform constrói o DAG (grafo de dependência) automaticamente.

---

## Como Integrar o Dataform ao Repositório GitHub no Google Cloud

A integração nativa permite que commits mesclados na branch `main` sejam sincronizados automaticamente com o ambiente de compilação do BigQuery Dataform.

### 1. Criar um Personal Access Token (PAT) no GitHub
1. No GitHub, acesse: **Settings** ➔ **Developer settings** ➔ **Personal access tokens** ➔ **Tokens (classic)**.
2. Clique em **Generate new token (classic)**.
3. Defina:
   - **Note:** `gcp-dataform-nimbus`
   - **Expiration:** 90 dias (ou o período desejado)
   - **Scopes:** marque a caixinha **`repo`** (Full control of private repositories).
4. Copie o token gerado.

### 2. Armazenar o Token no GCP Secret Manager
1. No Console do GCP, acesse **Secret Manager**.
2. Clique em **Criar Segredo** (Create Secret):
   - **Nome:** `github-dataform-pat`
   - **Valor do segredo:** Cole o Personal Access Token gerado no passo 1.
3. Clique em **Criar**.

> ** Permissão necessária:**
> Conceda o papel de **Acessador de segredos do Secret Manager** (*Secret Manager Secret Accessor*) à conta de serviço padrão do Dataform:
> `service-<PROJECT_NUMBER>@gcp-sa-dataform.iam.gserviceaccount.com`.

### 3. Conectar o Repositório no Dataform (BigQuery)
1. No Console do GCP, navegue até **BigQuery** ➔ **Dataform**.
2. Selecione a região do seu projeto (ex: `southamerica-east1` ou `us-east1`).
3. Clique em **Criar Repositório** (Create Repository) ou selecione o repositório existente:
   - **ID do Repositório:** `nimbus-dataform`.
4. Clique em **Conectar Repositório** (Connect Repository):
   - **URL do Git:** `https://github.com/ProjetoNimbuss/nimbus-platform.git`
   - **Ramo padrão (Default branch):** `main`
   - **Segredo (Secret):** Selecione o segredo `github-dataform-pat` criado no Secret Manager.
5. **Configurar o Diretório Raiz do Dataform:**
   - Em *Directory Path* (ou Diretório de Trabalho), defina: **`dataform`**
   - *(Isso avisa ao GCP que o código do Dataform está dentro da subpasta `/dataform`, e não na raiz do repositório).*
6. Clique em **Vincular** (Link).

---

## Ciclo de Vida dos Dados: dbt (Local) ➔ Dataform (GCP)

1. **Desenvolvimento Local:**
   - As regras de negócio e testes analíticos rápidos são criados e validados no `transform/` com **dbt e DuckDB** no ambiente de desenvolvimento local (custo zero).
2. **Promoção para Produção:**
   - Após a validação das regras, cria-se o modelo `.sqlx` correspondente em `dataform/definitions/`.
   - Abre-se o Pull Request no GitHub para a branch `main`.
3. **Sincronização & Execução:**
   - Após o merge na `main`, o Dataform no GCP compila as alterações automaticamente.
   - O **Prefect** (rodando na VM) aciona a execução do Dataform no BigQuery após o término de cada ciclo de ingestão.
