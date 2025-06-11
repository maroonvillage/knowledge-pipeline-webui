
output "instance_public_ip" {
  value       = aws_instance.app_server.public_ip
  description = "Public IP address of the EC2 instance"
}
output "instance_private_ip" {
  value       = aws_instance.app_server.private_ip
  description = "Private IP address of the EC2 instance"
}
output "instance_arn" {
  value       = aws_instance.app_server.arn
  description = "ARN of the EC2 instance"
} 
output "instance_type" {
  value       = aws_instance.app_server.instance_type
  description = "Type of the EC2 instance"
}
output "instance_availability_zone" {
  value       = aws_instance.app_server.availability_zone
  description = "Availability zone of the EC2 instance"
}
output "instance_tags" {
  value       = aws_instance.app_server.tags
  description = "Tags associated with the EC2 instance"
}
output "instance_key_name" {
  value       = aws_instance.app_server.key_name
  description = "Key name associated with the EC2 instance"
}
output "instance_security_groups" {
  value       = aws_instance.app_server.security_groups
  description = "Security groups associated with the EC2 instance"
}
output "hostname" {
  value       = aws_instance.app_server.public_dns
  description = "Public DNS name of the EC2 instance"
}
output "instance_id" {
  value       = aws_instance.app_server.id
  description = "ID of the EC2 instance"
}
output "instance_public_dns" {
  value       = aws_instance.app_server.public_dns
  description = "Public DNS of the EC2 instance"
}