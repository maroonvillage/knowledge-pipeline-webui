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
          "s3:ListBucket"
        ],
        "Resource": [
           aws_s3_bucket.pdfdocintel.arn,
          "${aws_s3_bucket.pdfdocintel.arn}/*"
        ]
      }
    ]
  })
}