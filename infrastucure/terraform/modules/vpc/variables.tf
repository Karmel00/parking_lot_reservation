variable "name" {
  description = "Prefiks nazw"
  type        = string
}

variable "region" {
  description = "Region AWS"
  type        = string
}

variable "availability_zone" {
  description = "Główna strefa"
  type        = string
}

variable "availability_zone_secondary" {
  description = "Druga strefa (RDS)"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR VPC"
  type        = string
}

variable "public_web_cidr" {
  description = "CIDR podsieci web"
  type        = string
}

variable "private_app_cidr" {
  description = "CIDR podsieci app"
  type        = string
}

variable "private_db_cidr" {
  description = "CIDR podsieci db"
  type        = string
}

variable "private_db_secondary_cidr" {
  description = "CIDR drugiej podsieci db"
  type        = string
}

variable "app_port" {
  description = "Port aplikacji"
  type        = number
}

variable "db_port" {
  description = "Port bazy"
  type        = number
}

