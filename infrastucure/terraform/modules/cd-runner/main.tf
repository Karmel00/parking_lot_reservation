terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

locals {
  parameter_prefix = "arn:aws:ssm:${var.region}:${var.account_id}:parameter/${var.project}"
}

# Konto usługowe dla pipeline'u CD w GitHub Actions (bez hasła do konsoli)
resource "aws_iam_user" "this" {
  name          = "${var.project}-cd-runner"
  force_destroy = true
}

# Minimalne uprawnienia do wdrożenia
data "aws_iam_policy_document" "deploy" {
  # Frontend: S3 sync
  statement {
    sid       = "FrontendBucket"
    actions   = ["s3:ListBucket"]
    resources = ["arn:aws:s3:::${var.frontend_bucket}"]
  }

  statement {
    sid       = "FrontendObjects"
    actions   = ["s3:PutObject", "s3:DeleteObject"]
    resources = ["arn:aws:s3:::${var.frontend_bucket}/*"]
  }

  # Frontend: invalidacja CloudFront
  statement {
    sid       = "CloudFrontInvalidation"
    actions   = ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"]
    resources = ["arn:aws:cloudfront::${var.account_id}:distribution/${var.distribution_id}"]
  }

  # Backend: obrazy w ECR
  statement {
    sid       = "EcrLogin"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid = "EcrPush"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:PutImage",
    ]
    resources = var.ecr_repository_arns
  }

  # Wartości dla CI (bucket, dystrybucja, VM, rejestr, adres aplikacji)
  statement {
    sid       = "ReadPublicParameters"
    actions   = ["ssm:GetParameter", "ssm:GetParameters"]
    resources = ["${local.parameter_prefix}/public/*"]
  }

  # docker-compose.yml i nginx.conf dla apply.sh
  statement {
    sid       = "WriteDeployParameters"
    actions   = ["ssm:PutParameter"]
    resources = ["${local.parameter_prefix}/deploy/*"]
  }

  # Uruchomienie apply.sh na VM
  statement {
    sid     = "RunDeployCommand"
    actions = ["ssm:SendCommand"]
    resources = [
      "arn:aws:ec2:${var.region}:${var.account_id}:instance/${var.instance_id}",
      "arn:aws:ssm:${var.region}::document/AWS-RunShellScript",
    ]
  }

  # Status komendy (akcja nie wspiera ograniczenia do zasobu)
  statement {
    sid       = "ReadCommandResult"
    actions   = ["ssm:GetCommandInvocation"]
    resources = ["*"]
  }
}

resource "aws_iam_user_policy" "deploy" {
  name   = "deploy"
  user   = aws_iam_user.this.name
  policy = data.aws_iam_policy_document.deploy.json
}
