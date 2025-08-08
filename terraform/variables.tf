variable "prefix" {
  description = "A prefix for resource names"
  type        = string
  default     = "pdfdocintel" # Example prefix
}
variable "ec2_policy_instance_arn" {
  description = "The ARN of the EC2 instance that will be created. This is used to set permissions for the instance."
  type        = string
  default     = "" # This can be set to the ARN of the EC2 instance once created.
  
}

variable "ecr_policy_instance_arn" {
  description = "The ARN of the ECR instance that will be created. This is used to set permissions for the ECR instance."
  type        = string
  default     = "arn:aws:iam::_ACCOUNT_ID_:policy/pdfdocintel-monolith-ecr" # This can be set to the ARN of the EC2 instance once created.
  
}

variable "s3_policy_instance_arn"  {
  description = "The ARN of the S3 instance that will be created. This is used to set permissions for the S3 instance."
  type        = string
  default     = "arn:aws:iam::_ACCOUNT_ID_:policy/pdfdocintel-monolith-s3" # This can be set to the ARN of the S3 instance once created.
  
}

variable "secretsmgr_policy_instance_arn"  {
  description = "The ARN of the Secrets Manager instance that will be created. This is used to set permissions for the Secrets Manager instance."
  type        = string
  default     = "arn:aws:iam::_ACCOUNT_ID_:policy/pdfdocintel-monolith-secretsmgr" # This can be set to the ARN of the Secrets Manager instance once created.
  
}

variable "allow_user_to_assume_ec2_role_arn" {
  description = "The ARN of the IAM User that should be allowed to assume the ec2_app_instance_role. Set to empty string or null to not allow any user."
  type        = string
  default     = "arn:aws:iam::_ACCOUNT_ID_:user/pdfdocintel-monolith-user" # Example: "arn:aws:iam::YOUR_ACCOUNT_ID:user/your-developer-user"
                   # Leave empty if no user should assume it by default.
}

variable "ssh_key_pair_name" {
  description = "The name of the existing AWS EC2 Key Pair to enable SSH access to the instance."
  type        = string
  default     = "next9_ssh_ec2_key_pair" # Example key pair name
}