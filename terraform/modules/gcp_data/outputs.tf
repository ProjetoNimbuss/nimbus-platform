output "bucket_names" {
  description = "Nomes de todos os buckets criados"
  value       = [for b in google_storage_bucket.buckets : b.name]
}

output "bucket_urls" {
  description = "URLs gs:// dos buckets criados"
  value       = { for k, b in google_storage_bucket.buckets : k => b.url }
}