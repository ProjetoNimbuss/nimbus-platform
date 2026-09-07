data "cloudflare_zone" "domain" {
  filter = {
    name = var.domain_name
  }
}

resource "cloudflare_dns_record" "subdomains" {
  for_each = toset(var.subdomains)
  zone_id = data.cloudflare_zone.domain.id
  name    = each.value              
  content = var.server_public_ip   
  type    = "A"
  ttl     = 1                      
  proxied = var.enable_proxy        
  comment = "Gerenciado via Terraform - Nimbus Platform"
}