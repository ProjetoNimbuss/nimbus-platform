variable "environment" {
  type        = string
  description = "Ambiente de deploy"
  default     = "prod"
}

variable "gcp_project_id" {
  type        = string
  description = "ID do projeto no GCP"
}
variable "gcp_region" {
  type        = string
  description = "Região principal do GCP para GCS e BigQuery"
  default     = "southamerica-east1"
}
variable "gcp_zone" {
  type        = string
  description = "Zona do GCP"
  default     = "southamerica-east1-a"
}

variable "mgc_api_key" {
  type        = string
  sensitive   = true
  description = "Chave de API da Magalu Cloud"
}
variable "mgc_region" {
  type        = string
  description = "Região da Magalu Cloud"
  default     = "br-ne1"
}
variable "ssh_public_key" {
  type        = string
  description = "Chave pública SSH"
}

variable "cloudflare_api_token" {
  type        = string
  sensitive   = true
  description = "Token de API do Cloudflare com permissão de edição de DNS"
}
variable "domain_name" {
  type        = string
  description = "Domínio principal gerenciado no Cloudflare"
}
variable "subdomains" {
  type        = list(string)
  description = "Lista de subdomínios a serem apontados para o servidor"
  default     = ["api", "app"]
}