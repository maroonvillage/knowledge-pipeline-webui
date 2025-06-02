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
