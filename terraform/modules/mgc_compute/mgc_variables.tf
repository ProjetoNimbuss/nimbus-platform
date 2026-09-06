variable "environment" {
  type        = string
  description = "Ambiente de deploy (prod)"
  default     = "prod"
}

variable "machine_type" {
  type        = string
  description = "Tipo de máquina virtual na Magalu Cloud"
  default     = "bv2-8-20"
}

variable "image_name" {
  type        = string
  description = "Imagem do Sistema Operacional"
  default     = "cloud-debian-12"
}

variable "ssh_public_key" {
  type        = string
  description = "Chave pública SSH"
}