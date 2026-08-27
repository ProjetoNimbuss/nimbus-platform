variable "gcp_project_id" {
    type = string
    descripition = "ID do projeto"
}

variable "gcp_region" {
    type = string
    default = "southamerica-east1-a"
}

variable "gcp_zone" {
    type = string
    default = "southamerica-east1-a"
}

variable "api_key" {
    type = string
    sensitive   = true
    description = "Magalu Cloud API Key"
}

variable "mgc_region" {
    type = string
    default = "br-ne1"
}

