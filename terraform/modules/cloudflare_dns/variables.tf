variable "domain_name" {
  type        = string
  description = "Domínio principal cadastrado no Cloudflare"
}

variable "server_public_ip" {
  type        = string
  description = "IP público da VM Magalu Cloud para onde o DNS apontará"
}

variable "subdomains" {
  type        = list(string)
  description = "subdomínios a serem criados apontando para o servidor"
  default     = [
    "api",   
    "app"    
  ]
}

variable "enable_proxy" {
  type        = bool
  description = "Tráfego passa pelo Proxy do Cloudflare (SSL + WAF + DDoS)"
  default     = true
}