variable "prefix" {
  description = "A prefix for resource names"
  type        = string
}

variable "aws_account_id" {
  description = "Your AWS Account ID"
  type        = string
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
  default     = "arn:aws:iam::686255962220:user/pdfdocintel-monolith-user" # Example: "arn:aws:iam::YOUR_ACCOUNT_ID:user/your-developer-user"
                   # Leave empty if no user should assume it by default.
}