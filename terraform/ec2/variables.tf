variable "region" {
  description = "value of the AWS region to deploy resources in"
  type    = string
}
variable "ec2_instance_profile_var" {
  description = "Instance profile name for EC2 instances"
}

variable "local_ip" {
  description = "Local IP address to allow SSH and HTTP access"
  type        = string
  default     = "192.168.87.21"
  
}