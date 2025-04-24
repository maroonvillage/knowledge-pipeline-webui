output "instance_profile_name" {
  value       = aws_iam_instance_profile.ec2_instance_profile.name
  description = "IAM instance profile name for EC2 instances"
}
output "ec2_role_name" {
  value       = aws_iam_role.ec2_role.name
  description = "IAM role name for EC2 instances"
}
output "data_caller_identity_account_id" {
  value       = data.aws_caller_identity.current.account_id
  description = "AWS account ID of the current caller"
}