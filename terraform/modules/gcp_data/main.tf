resource "google_storage_bucket" "buckets" {
  for_each = toset(var.bucket_names)
  name          = "${var.project_id}-${each.value}"
  location      = var.region
  force_destroy = false
  uniform_bucket_level_access = true
  versioning {
    enabled = true
  }
  labels = {
    environment = var.environment
    project     = "nimbus"
    layer       = "bronze"
  }
}