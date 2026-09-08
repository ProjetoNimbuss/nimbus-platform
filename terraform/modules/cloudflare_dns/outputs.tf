output "zone_id" {
  description = "ID da Zona no Cloudflare"
  value       = data.cloudflare_zone.domain.id
}

output "subdomain_hostnames" {
  description = "Hostnames completos gerados no Cloudflare"
  value       = { for k, r in cloudflare_dns_record.subdomains : k => r.hostname }
}