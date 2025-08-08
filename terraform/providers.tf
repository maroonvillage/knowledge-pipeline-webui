terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0" # Or the latest version
    }
  }
}

provider "aws" {
  region = "us-west-1" # Replace with your desired region
  assume_role {
    role_arn = "arn:aws:iam::567932485725:role/TerraformCloudDeploymentRole"
  }
}