output "gcp_bucket_names" {
  description = "Lista de todos os buckets criados no GCS"
  value       = module.gcp_data.bucket_names
}
output "gcp_bigquery_dataset_ids" {
  description = "IDs dos datasets criados no BigQuery (Bronze, Silver, Gold)"
  value       = module.gcp_data.bigquery_dataset_ids
}

output "mgc_instance_name" {
  description = "Nome da VM criada na Magalu Cloud"
  value       = module.mgc_compute.instance_name
}
output "mgc_instance_public_ip" {
  description = "Endereço IP público da VM na Magalu Cloud"
  value       = module.mgc_compute.public_ip
}

output "cloudflare_configured_hostnames" {
  description = "Hostnames protegidos e roteados pelo Cloudflare"
  value       = module.cloudflare_dns.subdomain_hostnames
}
