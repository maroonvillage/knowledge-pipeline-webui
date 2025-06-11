variable "region" {
  description = "value of the AWS region to deploy resources in"
  type    = string
}

variable "company_name" {
  type    = string
  default = "next9"
}

variable "ec2_role_name" {
  description = "IAM role name for EC2 instances"
  type        = string
}

variable "data_caller_identity_account_id" {
  description = "AWS account ID of the current caller"
  type        = string
}

variable "ec2_dns_name" {
  description = "Public DNS"
  type        = string
}