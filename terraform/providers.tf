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
}