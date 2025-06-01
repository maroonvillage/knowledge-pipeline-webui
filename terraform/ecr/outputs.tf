output "repo1_name" {
  value       = aws_ecr_repository.pdfdocintel_repo1.name
  description = "Name of the ECR repository"
} 
output "repo1_arn" {
  value       = aws_ecr_repository.pdfdocintel_repo1.arn
  description = "ARN of the ECR repository"
}
output "repo1_repository_url" {
  value       = aws_ecr_repository.pdfdocintel_repo1.repository_url
  description = "URL of the ECR repository"
}
output "repo1_registry_id" {
  value       = aws_ecr_repository.pdfdocintel_repo1.registry_id
  description = "Registry ID of the ECR repository"
}
output "repo1_image_tag_mutability" {
  value       = aws_ecr_repository.pdfdocintel_repo1.image_tag_mutability
  description = "Image tag mutability setting of the ECR repository"
}


output "repo2_name" {
  value       = aws_ecr_repository.pdfdocintel_repo2.name
  description = "Name of the ECR repository"
} 
output "repo2_arn" {
  value       = aws_ecr_repository.pdfdocintel_repo2.arn
  description = "ARN of the ECR repository"
}
output "repo2_repository_url" {
  value       = aws_ecr_repository.pdfdocintel_repo2.repository_url
  description = "URL of the ECR repository"
}
output "repo2_registry_id" {
  value       = aws_ecr_repository.pdfdocintel_repo2.registry_id
  description = "Registry ID of the ECR repository"
}
output "repo2_image_tag_mutability" {
  value       = aws_ecr_repository.pdfdocintel_repo2.image_tag_mutability
  description = "Image tag mutability setting of the ECR repository"
}