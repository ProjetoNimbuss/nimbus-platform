variable "project_id" {
  type        = string
  description = "ID do projeto GCP"
}

variable "region" {
  type        = string
  description = "Região dos buckets"
  default     = "southamerica-east1"
}

variable "environment" {
  type        = string
  description = "Ambiente-prod"
  default     = "prod"
}

variable "bucket_names" {
  type        = list(string)
  description = "Lista com os nomes dos buckets a serem criados"
  default = [
    "bronze-apac",
    "bronze-cemaden",
    "bronze-open-meteo-weather",
    "bronze-open-meteo-marine",
    "bronze-tomorrow-api",
    "geo-complementares",
    "img-reports-app"
  ]
}

variable "bigquery_layers" {
  type        = list(string)
  description = "Lista de datasets/camadas do BigQuery a serem criados"
  default     = ["bronze", "silver", "gold"]
}