#https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket
#-------------------------------------------------------------------------------
#  S3 Bucket Configuration
#-------------------------------------------------------------------------------

resource "aws_s3_bucket" "pdfdocintel" {
  bucket = "${var.company_name}bucket01"  # Replace with a globally unique bucket name. Consider using a random suffix for uniqueness.
  force_destroy = true  # Deletes all objects in the bucket when the bucket is destroyed

  tags = {
    Name        = var.company_name
    Environment = "dev"  # Or staging/prod
    ManagedBy   = "Terraform"
  }
}

resource "aws_s3_bucket_public_access_block" "pdfdocintel" {
  bucket = aws_s3_bucket.pdfdocintel.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true  
  restrict_public_buckets = true
}


resource "aws_s3_bucket_cors_configuration" "pdfdocintel" {
  bucket = aws_s3_bucket.pdfdocintel.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = ["https://${var.ec2_dns_name}"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Simulate a folder named "uploads/"
resource "aws_s3_object" "uploads" {
  bucket = aws_s3_bucket.pdfdocintel.bucket
  key    = "uploads/"  # Folder-like structure
  content = ""      # Empty content to simulate a folder
}

resource "aws_s3_bucket_policy" "s3_bucket_policy" {
  bucket = aws_s3_bucket.pdfdocintel.bucket

  policy = jsonencode({
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "AWS": "arn:aws:iam::${var.data_caller_identity_account_id}:role/${var.ec2_role_name}"
        },
        "Action": [
          "s3:GetObject",
          "s3:ListBucket",
          "s3:PutObject"
        ],
        "Resource": [
           aws_s3_bucket.pdfdocintel.arn,
          "${aws_s3_bucket.pdfdocintel.arn}/*"
        ]
      }
    ]
  })
}