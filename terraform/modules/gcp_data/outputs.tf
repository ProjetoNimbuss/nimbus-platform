output "bucket_names" {
  description = "Nomes de todos os buckets criados"
  value       = [for b in google_storage_bucket.buckets : b.name]
}

output "bucket_urls" {
  description = "URLs gs:// dos buckets criados"
  value       = { for k, b in google_storage_bucket.buckets : k => b.url }
}

output "bigquery_dataset_ids" {
  description = "IDs dos datasets criados no BigQuery"
  value       = { for k, d in google_bigquery_dataset.layers : k => d.dataset_id }
}