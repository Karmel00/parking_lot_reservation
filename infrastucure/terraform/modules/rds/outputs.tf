output "db_endpoint" {
  description = "Endpoint PostgreSQL"
  value       = aws_db_instance.postgres.address
}

output "db_port" {
  description = "Port PostgreSQL"
  value       = aws_db_instance.postgres.port
}

output "db_name" {
  description = "Nazwa bazy danych"
  value       = aws_db_instance.postgres.db_name
}

output "db_username" {
  description = "Użytkownik PostgreSQL"
  value       = aws_db_instance.postgres.username
}

output "db_secret_arn" {
  description = "ARN sekretu z hasłem administratora"
  value       = aws_db_instance.postgres.master_user_secret[0].secret_arn
}

output "log_group_name" {
  description = "Grupa logów PostgreSQL"
  value       = aws_cloudwatch_log_group.postgresql.name
}
