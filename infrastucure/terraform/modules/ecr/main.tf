terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

# Repozytoria obrazów backendu
resource "aws_ecr_repository" "this" {
  for_each = toset(var.services)

  name                 = "${var.project}-${each.key}"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = { Name = "${var.project}-${each.key}" }
}

# Stare obrazy wygasają (koszt storage)
resource "aws_ecr_lifecycle_policy" "this" {
  for_each   = aws_ecr_repository.this
  repository = each.value.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Zostaw ${var.keep_images} ostatnie obrazy"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = var.keep_images
      }
      action = { type = "expire" }
    }]
  })
}
