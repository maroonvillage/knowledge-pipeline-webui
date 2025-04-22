#https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket
#-------------------------------------------------------------------------------
#  S3 Bucket Configuration
#-------------------------------------------------------------------------------

resource "aws_s3_bucket" "pdfdocintel" {
  bucket = "${var.company_name}bucket01"  # Replace with a globally unique bucket name. Consider using a random suffix for uniqueness.
  

  tags = {
    Name        = var.company_name
    Environment = "dev"  # Or staging/prod
    ManagedBy   = "Terraform"
  }
}