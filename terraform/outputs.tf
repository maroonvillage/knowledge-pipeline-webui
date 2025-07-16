output "instance_public_ip" {
  value       = module.next9_ec2.instance_public_ip
  description = "Public IP address of the EC2 instance"
}

output "instance_public_dns" {
  value       = module.next9_ec2.instance_public_dns
  description = "Public DNS of the EC2 instance"
}