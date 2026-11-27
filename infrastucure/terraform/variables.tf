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
  default = {
    Kamil  = { policies = ["admin"] }
    Michal = { policies = ["frontend"] }
    Pawel  = { policies = ["backend", "db"] }
  }
}

variable "backend_services" {
  description = "Serwisy backendu"
  type        = list(string)
  default     = ["reservation-service", "authentication-service", "notification-service"]
}

variable "instance_type" {
  description = "Typ VM"
  type        = string
  default     = "t3.micro"
}

variable "instance_architecture" {
  description = "Architektura VM (x86_64 albo arm64)"
  type        = string
  default     = "x86_64"
}

variable "budget_limit_usd" {
  description = "Limit alertu kosztowego (USD)"
  type        = number
  default     = 30
}

variable "budget_emails" {
  description = "Adresy alertów (pusta lista = brak)"
  type        = list(string)
  default     = ["kamijjj.2005@gamil.com"]
}
