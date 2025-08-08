variable "prefix" {
  description = "A prefix for resource names"
  type        = string
}

variable "aws_account_id" {
  description = "Your AWS Account ID"
  type        = string
  default = ""
  # This can be explicitly passed, or you can use data.aws_caller_identity.current.account_id
}

variable "aws_region" {
  description = "Your AWS Region"
  type        = string
  # This can be explicitly passed, or you can use data.aws_region.current.name
}
variable "allow_user_to_assume_ec2_role_arn" {
  description = "The ARN of the IAM User that should be allowed to assume the ec2_app_instance_role. Set to empty string or null to not allow any user."
  type        = string
  default     = "" # Example: "arn:aws:iam::YOUR_ACCOUNT_ID:user/your-developer-user"
                   # Leave empty if no user should assume it by default.
}

variable "ec2_policy_instance_arn" {
  description = "The ARN of the EC2 instance that will be created. This is used to set permissions for the instance."
  type        = string
  default     = "" # This can be set to the ARN of the EC2 instance once created.
  
}

variable "ecr_policy_instance_arn" {
  description = "The ARN of the ECR instance that will be created. This is used to set permissions for the ECR instance."
  type        = string
  default     = "" # This can be set to the ARN of the EC2 instance once created.
  
}

variable "s3_policy_instance_arn"  {
  description = "The ARN of the S3 instance that will be created. This is used to set permissions for the S3 instance."
  type        = string
  default     = "" # This can be set to the ARN of the S3 instance once created.
  
}

variable "secretsmgr_policy_instance_arn"  {
  description = "The ARN of the Secrets Manager instance that will be created. This is used to set permissions for the Secrets Manager instance."
  type        = string
  default     = "" # This can be set to the ARN of the Secrets Manager instance once created.
  
}