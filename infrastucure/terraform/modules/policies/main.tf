terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

data "aws_caller_identity" "current" {}

# Polityki działają na zasobach z prefiksem "${var.project}-"
locals {
  account_id = data.aws_caller_identity.current.account_id

  read_logs_actions = [
    "logs:DescribeLogGroups",
    "logs:DescribeLogStreams",
    "logs:GetLogEvents",
    "logs:FilterLogEvents",
    "logs:StartQuery",
    "logs:StopQuery",
    "logs:GetQueryResults",
    "logs:DescribeQueries",
  ]
}

# Frontend: S3, CloudFront, logi
data "aws_iam_policy_document" "frontend" {
  statement {
    sid       = "ConsoleListBuckets"
    actions   = ["s3:ListAllMyBuckets", "s3:GetBucketLocation"]
    resources = ["*"]
  }

  statement {
    sid       = "FrontendBucket"
    actions   = ["s3:ListBucket", "s3:GetBucketLocation"]
    resources = ["arn:aws:s3:::${var.project}-frontend*"]
  }

  statement {
    sid       = "FrontendObjects"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["arn:aws:s3:::${var.project}-frontend*/*"]
  }

  statement {
    sid = "CloudFrontDeploy"
    actions = [
      "cloudfront:CreateInvalidation",
      "cloudfront:GetInvalidation",
      "cloudfront:ListInvalidations",
      "cloudfront:GetDistribution",
      "cloudfront:ListDistributions",
    ]
    resources = ["*"]
  }

  statement {
    sid       = "ReadLogs"
    actions   = local.read_logs_actions
    resources = ["*"]
  }
}

# Backend: ECR, ECS, logi, SSM, sekrety
data "aws_iam_policy_document" "backend" {
  statement {
    sid       = "EcrAuth"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid       = "EcrList"
    actions   = ["ecr:DescribeRepositories"]
    resources = ["*"]
  }

  statement {
    sid = "EcrPushPull"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:PutImage",
      "ecr:DescribeImages",
      "ecr:ListImages",
    ]
    resources = ["arn:aws:ecr:${var.region}:${local.account_id}:repository/${var.project}-*"]
  }

  statement {
    sid = "EcsReadAndRegister"
    actions = [
      "ecs:Describe*",
      "ecs:List*",
      "ecs:RegisterTaskDefinition",
    ]
    resources = ["*"]
  }

  statement {
    sid       = "EcsDeployProjectServices"
    actions   = ["ecs:UpdateService"]
    resources = ["arn:aws:ecs:${var.region}:${local.account_id}:service/${var.project}-*"]
  }

  statement {
    sid       = "PassEcsRoles"
    actions   = ["iam:PassRole"]
    resources = ["arn:aws:iam::${local.account_id}:role/${var.project}-*"]

    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values   = ["ecs-tasks.amazonaws.com"]
    }
  }

  statement {
    sid       = "ReadLogs"
    actions   = local.read_logs_actions
    resources = ["*"]
  }

  statement {
    sid     = "ReadAppParameters"
    actions = ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath"]
    resources = [
      "arn:aws:ssm:${var.region}:${local.account_id}:parameter/${var.project}/*"
    ]
  }

  statement {
    sid     = "ReadAppSecrets"
    actions = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
    resources = [
      "arn:aws:secretsmanager:${var.region}:${local.account_id}:secret:${var.project}/backend/*"
    ]
  }

  statement {
    sid       = "DescribeNetwork"
    actions   = ["ec2:DescribeVpcs", "ec2:DescribeSubnets", "ec2:DescribeSecurityGroups"]
    resources = ["*"]
  }
}

# DB: zarządzanie RDS projektu (bez tworzenia/usuwania)
data "aws_iam_policy_document" "db" {
  statement {
    sid       = "RdsDescribe"
    actions   = ["rds:Describe*", "rds:ListTagsForResource"]
    resources = ["*"]
  }

  statement {
    sid = "RdsManageProjectDb"
    actions = [
      "rds:ModifyDBInstance",
      "rds:RebootDBInstance",
      "rds:CreateDBSnapshot",
      "rds:DeleteDBSnapshot",
      "rds:RestoreDBInstanceFromDBSnapshot",
      "rds:ModifyDBParameterGroup",
      "rds:ResetDBParameterGroup",
    ]
    resources = [
      "arn:aws:rds:${var.region}:${local.account_id}:db:${var.project}-*",
      "arn:aws:rds:${var.region}:${local.account_id}:snapshot:${var.project}-*",
      "arn:aws:rds:${var.region}:${local.account_id}:pg:${var.project}-*",
      "arn:aws:rds:${var.region}:${local.account_id}:subgrp:${var.project}-*",
      "arn:aws:rds:${var.region}:${local.account_id}:og:${var.project}-*",
      "arn:aws:rds:${var.region}:${local.account_id}:og:default*",
      "arn:aws:rds:${var.region}:${local.account_id}:pg:default*",
    ]
  }

  statement {
    sid = "Monitoring"
    actions = concat(
      [
        "cloudwatch:GetMetricData",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics",
      ],
      local.read_logs_actions,
    )
    resources = ["*"]
  }

  statement {
    sid     = "DbSecrets"
    actions = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
    resources = [
      "arn:aws:secretsmanager:${var.region}:${local.account_id}:secret:${var.project}/db/*"
    ]
  }

  statement {
    sid       = "RdsManagedSecrets"
    actions   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
    resources = ["arn:aws:secretsmanager:${var.region}:${local.account_id}:secret:rds!*"]

    condition {
      test     = "StringLike"
      variable = "aws:ResourceTag/aws:rds:primaryDBInstanceArn"
      values   = ["arn:aws:rds:${var.region}:${local.account_id}:db:${var.project}-*"]
    }
  }

  statement {
    sid       = "DescribeNetwork"
    actions   = ["ec2:DescribeVpcs", "ec2:DescribeSubnets", "ec2:DescribeSecurityGroups"]
    resources = ["*"]
  }
}

# Dla każdego: własne hasło, MFA, klucze (&{} = ${} w IAM)
data "aws_iam_policy_document" "self_service" {
  statement {
    sid       = "ViewAccountInfo"
    actions   = ["iam:GetAccountPasswordPolicy", "iam:ListVirtualMFADevices"]
    resources = ["*"]
  }

  statement {
    sid = "ManageOwnPasswordAndKeys"
    actions = [
      "iam:ChangePassword",
      "iam:GetUser",
      "iam:GetLoginProfile",
      "iam:ListAccessKeys",
      "iam:CreateAccessKey",
      "iam:UpdateAccessKey",
      "iam:DeleteAccessKey",
      "iam:GetAccessKeyLastUsed",
    ]
    resources = ["arn:aws:iam::${local.account_id}:user/&{aws:username}"]
  }

  statement {
    sid       = "ManageOwnVirtualMFADevice"
    actions   = ["iam:CreateVirtualMFADevice", "iam:DeleteVirtualMFADevice"]
    resources = ["arn:aws:iam::${local.account_id}:mfa/*"]
  }

  statement {
    sid = "ManageOwnUserMFA"
    actions = [
      "iam:EnableMFADevice",
      "iam:DeactivateMFADevice",
      "iam:ListMFADevices",
      "iam:ResyncMFADevice",
    ]
    resources = ["arn:aws:iam::${local.account_id}:user/&{aws:username}"]
  }
}

locals {
  documents = {
    frontend       = data.aws_iam_policy_document.frontend.json
    backend        = data.aws_iam_policy_document.backend.json
    db             = data.aws_iam_policy_document.db.json
    "self-service" = data.aws_iam_policy_document.self_service.json
  }

  role_policies = ["frontend", "backend", "db"]
}

# Nowa rola: dodaj dokument wyżej, wpis w documents i w role_policies
resource "aws_iam_policy" "this" {
  for_each = local.documents
  name     = "${var.project}-${each.key}"
  policy   = each.value
}
