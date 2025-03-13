#https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"  # Or the latest version
    }
  }
}

provider "aws" {
  region = var.region
  assume_role {
    role_arn = "arn:aws:iam::686255962220:role/pdfdocintel-monolith-role"
  }
}


#-------------------------------------------------------------------------------
#  S3 Bucket Configuration
#-------------------------------------------------------------------------------

resource "aws_s3_bucket" "example" {
  bucket = "${var.company_name}bucket01"  # Replace with a globally unique bucket name. Consider using a random suffix for uniqueness.
  

  tags = {
    Name        = var.company_name
    Environment = "dev"  # Or staging/prod
    ManagedBy   = "Terraform"
  }
}