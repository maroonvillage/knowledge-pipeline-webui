
resource "aws_ecr_repository" "pdfdocintel" {
  name                 = "${var.company_name}_ecr_repository"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}