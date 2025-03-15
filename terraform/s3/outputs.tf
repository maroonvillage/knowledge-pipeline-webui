output "bucket_name" {
  value       = aws_s3_bucket.pdfdocintel.bucket
  description = "The name of the bucket"
}

output "bucket_arn" {
  value       = aws_s3_bucket.pdfdocintel.arn
  description = "The ARN of the S3 bucket"
}
output "bucket_region" {
  value       = aws_s3_bucket.pdfdocintel.region
  description = "The region where the S3 bucket is located"
}
output "bucket_id" {
  value       = aws_s3_bucket.pdfdocintel.id
  description = "The unique identifier of the S3 bucket"
}
output "bucket_domain_name" {
  value       = aws_s3_bucket.pdfdocintel.bucket_domain_name
  description = "The domain name of the S3 bucket"
}