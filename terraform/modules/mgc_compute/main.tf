resource "mgc_ssh_keys" "admin" {
  name = "nimbus-${var.environment}-key"
  key  = var.ssh_public_key
}

resource "mgc_virtual_machine_instances" "server" {
  name                 = "nimbus-server-${var.environment}"
  machine_type         = var.machine_type
  image                = var.image_name
  ssh_key_name         = mgc_ssh_keys.admin.name
  allocate_public_ipv4 = true
}