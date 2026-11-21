# Wersja Terraforma przypięta na sztywno (razem z .terraform-version)
terraform {
  required_version = "= 1.16.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # Bucket tworzony ręcznie; state zawiera hasła startowe
  backend "s3" {
    bucket       = "parking-lot-reservation-tfstate-907813425125-eu-west-1-an"
    key          = "v0/terraform.tfstate"
    region       = "eu-west-1"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project   = var.project
      ManagedBy = "terraform"
    }
  }
}

data "aws_caller_identity" "current" {}

module "policies" {
  source = "./modules/policies"

  project = var.project
  region  = var.region
}

module "iam" {
  source = "./modules/iam"

  users                   = var.users
  policy_arns             = module.policies.policy_arns
  self_service_policy_arn = module.policies.self_service_policy_arn
}

module "vpc" {
  source = "./modules/vpc"

  name   = var.project
  region = var.region

  availability_zone           = var.availability_zone
  availability_zone_secondary = var.availability_zone_secondary

  vpc_cidr                  = var.vpc_cidr
  public_web_cidr           = var.public_web_cidr
  private_app_cidr          = var.private_app_cidr
  private_db_cidr           = var.private_db_cidr
  private_db_secondary_cidr = var.private_db_secondary_cidr

  app_port = var.app_port
  db_port  = var.db_port
}

module "rds" {
  source = "./modules/rds"

  project = var.project

  db_subnet_group_name = module.vpc.db_subnet_group_name
  db_security_group_id = module.vpc.security_group_ids.db

  db_name     = "parking_reservation"
  db_username = "parking_admin"

  instance_class    = "db.t4g.micro"
  allocated_storage = 20
  db_port           = var.db_port
}

module "ecr" {
  source = "./modules/ecr"

  project  = var.project
  services = var.backend_services
}

module "compute" {
  source = "./modules/compute"

  project    = var.project
  region     = var.region
  account_id = data.aws_caller_identity.current.account_id

  # SG app daje dostęp do bazy
  vpc_id                   = module.vpc.vpc_id
  subnet_id                = module.vpc.subnet_ids.public_web
  extra_security_group_ids = [module.vpc.security_group_ids.app]

  instance_type = var.instance_type
  architecture  = var.instance_architecture

  ecr_registry        = module.ecr.registry
  ecr_repository_arns = module.ecr.repository_arns

  db_host       = module.rds.db_endpoint
  db_port       = module.rds.db_port
  db_name       = module.rds.db_name
  db_secret_arn = module.rds.db_secret_arn
}

module "frontend" {
  source = "./modules/frontend"

  project           = var.project
  account_id        = data.aws_caller_identity.current.account_id
  api_origin_domain = module.compute.public_dns
}

module "budget" {
  source = "./modules/budget"

  project   = var.project
  limit_usd = var.budget_limit_usd
  emails    = var.budget_emails
}

module "cd-runner" {
  source = "./modules/cd-runner"

  project    = var.project
  region     = var.region
  account_id = data.aws_caller_identity.current.account_id

  frontend_bucket     = module.frontend.bucket_name
  distribution_id     = module.frontend.distribution_id
  ecr_repository_arns = module.ecr.repository_arns
  instance_id         = module.compute.instance_id
}

# Wartości dla CI (bez dostępu do state)
locals {
  public_parameters = {
    "app-url"         = "https://${module.frontend.domain_name}"
    "frontend-bucket" = module.frontend.bucket_name
    "distribution-id" = module.frontend.distribution_id
    "instance-id"     = module.compute.instance_id
    "ecr-registry"    = module.ecr.registry
  }
}

resource "aws_ssm_parameter" "public" {
  for_each = local.public_parameters

  name  = "/${var.project}/public/${each.key}"
  type  = "String"
  value = each.value
}

# Metryki Route 53 i CloudFront
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project   = var.project
      ManagedBy = "terraform"
    }
  }
}

module "monitoring" {
  source = "./modules/monitoring"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  project         = var.project
  region          = var.region
  app_domain      = module.frontend.domain_name
  distribution_id = module.frontend.distribution_id
  instance_id     = module.compute.instance_id
  app_log_group   = module.compute.log_group_name
  alert_emails    = var.budget_emails
}

