# Logi Postgres
resource "aws_cloudwatch_log_group" "postgresql" {
  name              = "/aws/rds/instance/${var.project}-postgres/postgresql"
  retention_in_days = 7
}

resource "aws_db_instance" "postgres" {
  # Podstawowa konfiguracja
  identifier     = "${var.project}-postgres"
  engine         = "postgres"
  engine_version = "17"

  instance_class    = var.instance_class
  allocated_storage = var.allocated_storage
  storage_type      = "gp3"

  # Baza danych
  db_name  = var.db_name
  username = var.db_username
  port     = var.db_port

  # Hasło zarządzane przez AWS Secrets Manager
  manage_master_user_password = true

  # Sieć i bezpieczeństwo
  db_subnet_group_name   = var.db_subnet_group_name
  vpc_security_group_ids = [var.db_security_group_id]
  publicly_accessible    = false

  # Eksport logów bazy do CloudWatch
  enabled_cloudwatch_logs_exports = ["postgresql"]

  # Bezpieczeństwo danych
  storage_encrypted = true

  # Backup
  backup_retention_period = 1
  copy_tags_to_snapshot   = true

  # Konfiguracja środowiska projektowego
  multi_az                   = false
  auto_minor_version_upgrade = true
  deletion_protection        = false
  skip_final_snapshot        = true

  tags = {
    Name = "${var.project}-postgres"
    Tier = "database"
  }

  depends_on = [aws_cloudwatch_log_group.postgresql]
}