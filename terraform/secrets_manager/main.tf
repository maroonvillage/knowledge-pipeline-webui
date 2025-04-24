# resource "aws_secretsmanager_secret" "api_key" {
#   name = var.pinecone_api_key
# }

# resource "aws_secretsmanager_secret_version" "api_key_value" {
#   secret_id     = aws_secretsmanager_secret.api_key.id
#   secret_string = "your_super_secret_api_key_value"  # Replace with actual value
# }