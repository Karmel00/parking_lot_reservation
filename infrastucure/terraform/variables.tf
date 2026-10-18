variable "project" {
  description = "Prefiks nazw zasobów"
  type        = string
  default     = "parking-lot-reservation"
}

variable "region" {
  description = "Region AWS"
  type        = string
  default     = "eu-west-1"
}

variable "availability_zone" {
  description = "Główna strefa"
  type        = string
  default     = "eu-west-1a"
}

variable "availability_zone_secondary" {
  description = "Druga strefa (RDS)"
  type        = string
  default     = "eu-west-1b"
}

variable "vpc_cidr" {
  description = "CIDR VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_web_cidr" {
  description = "CIDR podsieci web"
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_app_cidr" {
  description = "CIDR podsieci app"
  type        = string
  default     = "10.0.2.0/24"
}

variable "private_db_cidr" {
  description = "CIDR podsieci db"
  type        = string
  default     = "10.0.3.0/24"
}

variable "private_db_secondary_cidr" {
  description = "CIDR drugiej podsieci db"
  type        = string
  default     = "10.0.4.0/24"
}

variable "app_port" {
  description = "Port aplikacji"
  type        = number
  default     = 8080
}

variable "db_port" {
  description = "Port bazy"
  type        = number
  default     = 5432
}

variable "users" {
  description = "Użytkownicy IAM i ich polityki"
  type = map(object({
    policies = list(string)
  }))
}
