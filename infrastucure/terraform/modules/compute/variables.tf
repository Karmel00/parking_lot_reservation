variable "project" {
  description = "Prefiks nazw"
  type        = string
}

variable "region" {
  description = "Region AWS"
  type        = string
}

variable "account_id" {
  description = "ID konta AWS"
  type        = string
}

variable "vpc_id" {
  description = "VPC"
  type        = string
}

variable "subnet_id" {
  description = "Podsieć VM"
  type        = string
}

variable "extra_security_group_ids" {
  description = "Dodatkowe SG"
  type        = list(string)
  default     = []
}

variable "instance_type" {
  description = "Typ instancji"
  type        = string
  default     = "t3.micro"
}

variable "architecture" {
  description = "Architektura AMI"
  type        = string
  default     = "x86_64"

  validation {
    condition     = contains(["x86_64", "arm64"], var.architecture)
    error_message = "Dozwolone: x86_64, arm64."
  }
}

variable "root_volume_gb" {
  description = "Rozmiar dysku (GB)"
  type        = number
  default     = 20
}

variable "compose_version" {
  description = "Wersja wtyczki Docker Compose"
  type        = string
  default     = "v2.29.7"
}

variable "ecr_registry" {
  description = "Host rejestru ECR"
  type        = string
}

variable "ecr_repository_arns" {
  description = "Repozytoria ECR"
  type        = list(string)
}

variable "db_host" {
  description = "Endpoint PostgreSQL"
  type        = string
}

variable "db_port" {
  description = "Port PostgreSQL"
  type        = number
}

variable "db_name" {
  description = "Nazwa bazy"
  type        = string
}

variable "db_secret_arn" {
  description = "ARN sekretu bazy"
  type        = string
}
