# resource "aws_secretsmanager_secret" "pc_api_key" {
#   name = var.pinecone_api_key
# }

# resource "aws_secretsmanager_secret_version" "pc_api_key_value" {
#   secret_id     = aws_secretsmanager_secret.pc_api_key.id
#   secret_string = "13707c0e-f5d1-4eaa-8c72-4988914c1de3"  # Replace with actual value
# }

# resource "aws_secretsmanager_secret" "neo4j_auth_key" {
#   name = var.neo4j_auth_key
# }

# resource "aws_secretsmanager_secret_version" "neo4j_auth_key_value" {
#   secret_id     = aws_secretsmanager_secret.neo4j_auth_key.id
#   secret_string = "ry8qCNwcZajMLLzq_fmzZER6DYcn3JMKfSTY0-HpZlw"  # Replace with actual value
# }