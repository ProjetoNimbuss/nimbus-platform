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

resource "google_bigquery_dataset" "layers" {
  for_each = toset(var.bigquery_layers)
  dataset_id                  = "nimbus_${each.value}_${var.environment}"
  friendly_name               = "Nimbus ${title(each.value)} Layer"
  description                 = "Dataset da camada ${each.value} para o projeto Nimbus (${var.environment})"
  location                    = var.region
  delete_contents_on_destroy  = false # Protege os dados criados pelo dbt/pipelines
  labels = {
    environment = var.environment
    project     = "nimbus"
    layer       = each.value
  }
}