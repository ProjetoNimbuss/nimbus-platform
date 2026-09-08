output "instance_id" {
  description = "ID da instância na Magalu Cloud"
  value       = mgc_virtual_machine_instances.server.id
}

output "instance_name" {
  description = "Nome da instância"
  value       = mgc_virtual_machine_instances.server.name
}

output "public_ip" {
  description = "IP público da instância"
  value       = mgc_virtual_machine_instances.server.network.public_address.ip
}
