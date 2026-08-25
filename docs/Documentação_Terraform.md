## Terraform

### O que é Terraform?

Terraform é uma ferramenta utilizada para subir infraestrutura em forma de código. Podemos através dele provisionar infraestrutura em nuvens, como VMs, Storage e afins. As gande nuvens e provedores possuem a opção de utilizar terraform, como GCP, OCI, AWS, AZURE, Claudflare e outros.

Ao subir a infraestrutura com terraform podemos versioná-la, compartilhá-la e replicá-la, podendo com ajustes de chaves subir a mesma estrutura na minha e na sua conta GCP por exemplo.

> O Terraform é composto por alguns arquivos .tf é será detalhado estrutura e finalidade de cada um deles.

>  **ATENÇÃO! A SEGUIR SÃO APENAS EXEMPLOS QUE VISÃO DEMONSTRAR O BÁSICO DA ESTRUTURA DO TERRAFORM. PARA MANIPULAR O TERRAFORM É NECESSÁRIO CERTEZA DO QUE ESTÁ SENDO FEITO, POIS AFETARA A INFRAESTRUTURA DO PROJETO COMO TAMBÉM PODE GERAR CUSTOS ADICIONAIS AO PROVISIONAR INCORRETAMENTE UM SERVIÇO.**  

Responsável por configurações do terraform, conexão com nuvem e autenticação.

**Componentes do arquivo**

- `terraform {}`: Bloco global de configuração do motor do Terraform.
    
- `required_version`: Trava de compatibilidade da versão da CLI do Terraform.
    
- `required_providers`: Lista os plugins necessários e sua origem (`source`) no Terraform Registry.
    
- `version`: Regra semântica de versão (`~> 5.0` permite atualizações menores compatíveis, como 5.1 ou 5.2, mas bloqueia 6.0).
    
- `provider "google" {}`: Configura os parâmetros de acesso ao provedor (como região padrão, perfis de credenciais ou endpoints).

**Exemplo de arquivo para o provedor GCP**

```
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
```
### variables.tf

Declara todas as variáveis de entrada com tipo, descrição e valor padrão opcional.

**Exemplo de arquivo para o provedor GCP**

```
variable "project_id" {
  type        = string
  description = "ID do projeto no Google Cloud"
}

variable "region" {
  type        = string
  description = "Região padrão para os recursos do GCP"
  default     = "southamerica-east1" # São Paulo
}

variable "location" {
  type        = string
  description = "Localização geográfica para dados (GCS e BigQuery)"
  default     = "southamerica-east1"
}

variable "environment" {
  type        = string
  description = "Ambiente de deploy (dev, staging, prod)"
  default     = "dev"
}

variable "retention_days" {
  type        = number
  description = "Dias para expiração de arquivos temporários no GCS"
  default     = 30
}
```
### terraform.tfvars

Atribui valores às variáveis declaradas em `variables.tf`. É o arquivo que você personaliza por ambiente (dev, staging, prod). **Não deve ser commitado se contiver segredos.**

```
project_id     = "meu-projeto-gcp-123456"
region         = "southamerica-east1"
location       = "southamerica-east1"
environment    = "prod"
retention_days = 90
```
### main.tf

Contém os recursos (`resource`) e módulos (`module`) que você quer provisionar.

```
# 1. Google Cloud Storage (Bucket de Dados / Data Lake)

resource "google_storage_bucket" "data_lake" {
  name          = "${local.name_prefix}-lake-${var.project_id}"
  location      = var.location
  force_destroy = false

  # Bloqueia acesso público e unifica permissões via IAM
  uniform_bucket_level_access = true

  # Histórico de versões de arquivos
  versioning {
    enabled = true
  }

  # Regra de ciclo de vida para exclusão de arquivos antigos
  lifecycle_rule {
    condition {
      age = var.retention_days
    }
    action {
      type = "Delete"
    }
  }

  labels = local.common_labels
}

# 2. BigQuery Dataset

resource "google_bigquery_dataset" "analytics_dataset" {
  dataset_id  = replace("${local.name_prefix}_analytics", "-", "_")
  description = "Dataset central para análises e relatórios de ${var.environment}"
  location    = var.location

  delete_contents_on_destroy = false
  labels                     = local.common_labels
}


# 3. BigQuery Table (Tabela de Eventos Particionada)

resource "google_bigquery_table" "events_table" {
  dataset_id = google_bigquery_dataset.analytics_dataset.dataset_id
  table_id   = "tb_eventos_processados"
  
  deletion_protection = false

  # Particionamento diário pelo campo timestamp (reduz custo de queries)
  time_partitioning {
    type  = "DAY"
    field = "event_timestamp"
  }

  # Esquema da tabela em formato JSON
  schema = jsonencode([
    {
      name        = "event_id"
      type        = "STRING"
      mode        = "REQUIRED"
      description = "Identificador único do evento"
    },
    {
      name        = "user_id"
      type        = "STRING"
      mode        = "NULLABLE"
      description = "ID do usuário associado"
    },
    {
      name        = "event_timestamp"
      type        = "TIMESTAMP"
      mode        = "REQUIRED"
      description = "Data e hora exatas do evento"
    },
    {
      name        = "payload"
      type        = "JSON"
      mode        = "NULLABLE"
      description = "Dados adicionais em JSON"
    }
  ])

  labels = local.common_labels
}
```

### outputs.tf

Declara os valores que o Terraform vai expor após o `apply`, como IPs, ARNs, URLs. Essencial para integração entre módulos.

```
output "gcs_bucket_name" {
  value       = google_storage_bucket.data_lake.name
  description = "Nome do Bucket GCS criado"
}

output "gcs_bucket_url" {
  value       = google_storage_bucket.data_lake.url
  description = "URL do Bucket no formato gs://"
}

output "bigquery_dataset_id" {
  value       = google_bigquery_dataset.analytics_dataset.dataset_id
  description = "ID do Dataset do BigQuery"
}

output "bigquery_table_id" {
  value       = google_bigquery_table.events_table.table_id
  description = "Nome da tabela do BigQuery criada"
}
```

### backend.tf

Configura onde o **state** será armazenado remotamente (S3, GCS, Terraform Cloud, etc.). Fundamental para trabalho em equipe.

```
terraform {
  backend "gcs" {
    bucket = "meu-projeto-terraform-state-prod"
    prefix = "terraform/state/data-platform"
  }
}
```

###  Principais comandos do terraform

- `terraform init` — Inicializa o diretório de trabalho, baixa os plugins dos provedores (_providers_) e configura o backend de estado.
    
    - `-upgrade`: Atualiza os módulos e plugins para as versões mais recentes compatíveis.
        
    - `-reconfigure`: Ignora o estado local existente e reconfigura o backend do zero.
        
- `terraform plan` — Compara o código com a infraestrutura real e gera a prévia de alterações (criação, modificação ou destruição).
    
    - `-out=tfplan`: Salva o plano de execução em um arquivo binário para garantir execução exata.
        
    - `-var="chave=valor"`: Injeta o valor de uma variável diretamente pela linha de comando.
        
    - `-var-file="prod.tfvars"`: Carrega um arquivo específico de variáveis.
        
    - `-target="recurso.nome"`: Limita o plano a um recurso específico e suas dependências diretas.
        
- `terraform apply` — Executa as alterações planejadas na nuvem.
    
    - `tfplan`: Aplica um plano pré-gerado sem reavaliar o estado.
        
    - `-auto-approve`: Pula a confirmação interativa `yes/no` (ideal para pipelines de CI/CD).
        
- `terraform destroy` — Remove com segurança todos os recursos gerenciados pelo projeto atual.
    
    - `-target="recurso.nome"`: Destrói apenas o recurso selecionado.
    
- `terraform state list` — Lista todos os recursos cadastrados no arquivo `terraform.tfstate`.
    
- `terraform state show <recurso>` — Exibe todos os atributos, metadados e IDs gerenciados de um recurso específico.
    
- `terraform state mv <origem> <destino>` — Renomeia ou move um recurso no estado sem precisar destruí-lo e recriá-lo na nuvem (útil para refatorações).
    
- `terraform state rm <recurso>` — Remove o recurso do controle do Terraform sem apagá-lo da nuvem.
    
- `terraform state pull` — Baixa e exibe no terminal o conteúdo bruto do estado remoto atual.
    
- `terraform import <recurso.nome> <id_remoto>` — Traz um recurso já criado manualmente na nuvem para dentro do gerenciamento do Terraform.

