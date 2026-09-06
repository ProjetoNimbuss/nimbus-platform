variable "gcp_project_id" {
    type = string
    description = "ID do projeto"
}

variable "gcp_region" {
    type = string
    default = "southamerica-east1"
}

variable "gcp_zone" {
    type = string
    default = "southamerica-east1-a"
}

variable "mgc_api_key" {
    type = string
    sensitive   = true
    description = "Magalu Cloud API Key"
}

variable "mgc_region" {
    type = string
    default = "br-ne1"
}

variable "cloudflare_api_token" {
    type = string
}