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
  default     = "47.150.114.89"
  
}

variable "ami_id" {
  description = "AMI ID for the EC2 instance"
  type        = string
  default     = "ami-0ce45259f491c3d4f" # Example AMI ID, replace with your own
  
}

variable "instance_type" {
  description = "Instance type for the EC2 instance"
  type        = string
  default     = "t2.medium" # Example instance type, adjust as needed
  
}