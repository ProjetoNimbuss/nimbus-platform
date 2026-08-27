terraform {
    required_version = {
        google = {
            source = "hashicorp/google"
            version = "7.46.0"
        }
        mgc = {
            source = "MagaluCloud/mgc"
            version = "0.56.0-beta1"
        }
        cloudflare = {
            source = "cloudflare/cloudflare"
            version = "5.24.0"
        }
    }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
  zone = var.gcp_zone
}

provider "mgc" {
  api_key = var.mgc_api_key
  region = var.mgc_region 
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}