output "console_login_url" {
  value = "https://${data.aws_caller_identity.current.account_id}.signin.aws.amazon.com/console"
}

output "iam_initial_passwords" {
  value     = module.iam.initial_passwords
  sensitive = true
}

output "vpc_id" {
  value = module.vpc.vpc_id
}

output "subnet_ids" {
  value = module.vpc.subnet_ids
}

output "security_group_ids" {
  value = module.vpc.security_group_ids
}

output "db_subnet_group_name" {
  value = module.vpc.db_subnet_group_name
}

output "rds_endpoint" {
  description = "Adres endpointu PostgreSQL"
  value       = module.rds.db_endpoint
}

output "rds_port" {
  description = "Port PostgreSQL"
  value       = module.rds.db_port
}

output "rds_database_name" {
  description = "Nazwa bazy danych"
  value       = module.rds.db_name
}

output "rds_secret_arn" {
  description = "ARN sekretu administratora PostgreSQL"
  value       = module.rds.db_secret_arn
}

output "app_url" {
  description = "Adres aplikacji (CloudFront)"
  value       = "https://${module.frontend.domain_name}"
}

output "frontend_bucket" {
  value = module.frontend.bucket_name
}

output "cloudfront_distribution_id" {
  value = module.frontend.distribution_id
}

output "backend_instance_id" {
  description = "VM z backendem"
  value       = module.compute.instance_id
}

output "backend_public_ip" {
  value = module.compute.public_ip
}

output "ecr_repository_urls" {
  value = module.ecr.repository_urls
}
