output "instance_id" {
  description = "ID da instância na Magalu Cloud"
  value       = mgc_virtual_machine_instances.server.id
}

output "instance_name" {
  description = "Nome da instância"
  value       = mgc_virtual_machine_instances.server.name
}

output "private_ip" {
  description = "IP privado interno da instância"
  value       = mgc_virtual_machine_instances.server.local_ipv4
}

output "public_ip" {
  description = "IP público da instância (se alocado)"
  value       = mgc_virtual_machine_instances.server.ipv4
}
