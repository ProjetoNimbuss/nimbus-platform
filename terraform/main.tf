module "gcp_data" {
  source      = "./modules/gcp_data"
  project_id  = var.gcp_project_id
  region      = var.gcp_region
  environment = var.environment
}

module "mgc_compute" {
  source         = "./modules/mgc_compute"
  environment    = var.environment
  ssh_public_key = var.ssh_public_key
}

module "cloudflare_dns" {
  source           = "./modules/cloudflare_dns"
  domain_name      = var.domain_name
  server_public_ip = module.mgc_compute.public_ip 
  subdomains       = var.subdomains
}