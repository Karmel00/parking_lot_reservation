terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

locals {
  name      = "${var.project}-app"
  log_group = "/${var.project}/app"
}

data "aws_ssm_parameter" "ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-${var.architecture}"
}

# Security group: HTTP tylko z CloudFront
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

resource "aws_security_group" "edge" {
  name        = "${var.project}-edge"
  description = "VM: HTTP tylko z CloudFront"
  vpc_id      = var.vpc_id

  tags = { Name = "${var.project}-sg-edge" }
}

resource "aws_vpc_security_group_ingress_rule" "http_from_cloudfront" {
  security_group_id = aws_security_group.edge.id
  description       = "HTTP z CloudFront"
  prefix_list_id    = data.aws_ec2_managed_prefix_list.cloudfront.id
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
}

# Ruch wychodzący tylko HTTPS: ECR, SSM, CloudWatch, Docker Hub, GitHub, pakiety
resource "aws_vpc_security_group_egress_rule" "https" {
  security_group_id = aws_security_group.edge.id
  description       = "HTTPS wychodzacy (ECR, SSM, CloudWatch, obrazy, pakiety)"
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
}

# Rola VM
data "aws_iam_policy_document" "assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "this" {
  name               = "${var.project}-ec2"
  assume_role_policy = data.aws_iam_policy_document.assume.json
}

# Session Manager zamiast SSH
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.this.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

data "aws_iam_policy_document" "app" {
  statement {
    sid       = "EcrLogin"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid = "EcrPull"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
    ]
    resources = var.ecr_repository_arns
  }

  statement {
    sid       = "ReadConfig"
    actions   = ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath"]
    resources = ["arn:aws:ssm:${var.region}:${var.account_id}:parameter/${var.project}/*"]
  }

  statement {
    sid       = "ReadDbSecret"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [var.db_secret_arn]
  }

  statement {
    sid       = "WriteLogs"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.app.arn}:*"]
  }
}

resource "aws_iam_role_policy" "app" {
  name   = "app"
  role   = aws_iam_role.this.id
  policy = data.aws_iam_policy_document.app.json
}

resource "aws_iam_instance_profile" "this" {
  name = "${var.project}-ec2"
  role = aws_iam_role.this.name
}

# Logi kontenerów
resource "aws_cloudwatch_log_group" "app" {
  name              = local.log_group
  retention_in_days = 7

  tags = { Name = local.name }
}

# Jawne zmienne serwisów; login i hasło bazy VM dopisuje z sekretu
resource "aws_ssm_parameter" "app_env" {
  name = "/${var.project}/config/app-env"
  type = "String"

  # PGSSLMODE: TLS do RDS bez zmian w kodzie
  value = join("\n", [
    "NODE_ENV=production",
    "DB_HOST=${var.db_host}",
    "DB_PORT=${var.db_port}",
    "DB_NAME=${var.db_name}",
    "PGSSLMODE=verify-full",
    "NODE_EXTRA_CA_CERTS=/etc/ssl/rds-ca.pem",
  ])
}

# VM w podsieci publicznej (podsieć app nie ma NAT)
resource "aws_instance" "this" {
  ami                    = data.aws_ssm_parameter.ami.insecure_value
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = concat([aws_security_group.edge.id], var.extra_security_group_ids)
  iam_instance_profile   = aws_iam_instance_profile.this.name

  # Inicjalizacja przy pierwszym starcie
  user_data = templatefile("${path.module}/vm-init.sh.tftpl", {
    project         = var.project
    region          = var.region
    db_secret_arn   = var.db_secret_arn
    ecr_registry    = var.ecr_registry
    log_group       = local.log_group
    compose_version = var.compose_version
  })

  # Domyślne "unlimited" w T3 nalicza dopłaty
  credit_specification {
    cpu_credits = "standard"
  }

  metadata_options {
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = var.root_volume_gb
    encrypted   = true
  }

  tags        = { Name = local.name }
  volume_tags = { Name = local.name }

  # Bez tego nowe AMI albo zmiana vm-init wymieniałyby działającą VM
  lifecycle {
    ignore_changes = [ami, user_data]
  }

  depends_on = [
    aws_iam_role_policy.app,
    aws_iam_role_policy_attachment.ssm,
    aws_ssm_parameter.app_env,
  ]
}

# Stały adres (origin CloudFront)
resource "aws_eip" "this" {
  domain   = "vpc"
  instance = aws_instance.this.id

  tags = { Name = local.name }
}

# Agent CloudWatch RAM
resource "aws_iam_role_policy_attachment" "cw_agent" {
  role       = aws_iam_role.this.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_ssm_parameter" "cw_agent" {
  name = "AmazonCloudWatch-${var.project}"
  type = "String"
  value = jsonencode({
    agent = { metrics_collection_interval = 60 }
    metrics = {
      namespace         = "CWAgent"
      append_dimensions = { InstanceId = "$${aws:InstanceId}" }
      metrics_collected = {
        mem = { measurement = ["mem_used_percent"] }
      }
    }
  })
}

resource "aws_ssm_association" "cw_agent_install" {
  association_name = "${var.project}-cw-agent-install"
  name             = "AWS-ConfigureAWSPackage"

  parameters = {
    action = "Install"
    name   = "AmazonCloudWatchAgent"
  }

  targets {
    key    = "InstanceIds"
    values = [aws_instance.this.id]
  }

  wait_for_success_timeout_seconds = 600
}

resource "aws_ssm_association" "cw_agent_config" {
  association_name    = "${var.project}-cw-agent-config"
  name                = "AmazonCloudWatch-ManageAgent"
  schedule_expression = "rate(1 day)"

  parameters = {
    action                        = "configure"
    mode                          = "ec2"
    optionalConfigurationSource   = "ssm"
    optionalConfigurationLocation = aws_ssm_parameter.cw_agent.name
    optionalRestart               = "yes"
  }

  targets {
    key    = "InstanceIds"
    values = [aws_instance.this.id]
  }

  depends_on = [
    aws_ssm_association.cw_agent_install,
    aws_iam_role_policy_attachment.cw_agent,
  ]
}
