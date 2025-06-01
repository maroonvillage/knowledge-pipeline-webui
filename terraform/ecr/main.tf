
resource "aws_ecr_repository" "pdfdocintel_repo1" {
  name                 = "${var.company_name}-frontend-app-repo"
  image_tag_mutability = "MUTABLE"
  force_delete = true 

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "pdfdocintel_repo2" {
  name                 = "${var.company_name}-backend-app-repo"
  image_tag_mutability = "MUTABLE"
  force_delete = true 

  image_scanning_configuration {
    scan_on_push = true
  }
}