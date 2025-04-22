output "name" {
  value       = aws_ecr_repository.pdfdocintel.name
  description = "Name of the ECR repository"
} 
output "arn" {
  value       = aws_ecr_repository.pdfdocintel.arn
  description = "ARN of the ECR repository"
}
output "repository_url" {
  value       = aws_ecr_repository.pdfdocintel.repository_url
  description = "URL of the ECR repository"
}
output "registry_id" {
  value       = aws_ecr_repository.pdfdocintel.registry_id
  description = "Registry ID of the ECR repository"
}
output "image_tag_mutability" {
  value       = aws_ecr_repository.pdfdocintel.image_tag_mutability
  description = "Image tag mutability setting of the ECR repository"
}