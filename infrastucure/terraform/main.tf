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
