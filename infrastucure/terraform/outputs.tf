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