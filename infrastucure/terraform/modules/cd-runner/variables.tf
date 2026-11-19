variable "project" {
  description = "Prefiks nazw zasobów"
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

variable "frontend_bucket" {
  description = "Bucket frontendu"
  type        = string
}

variable "distribution_id" {
  description = "ID dystrybucji CloudFront"
  type        = string
}

variable "ecr_repository_arns" {
  description = "Repozytoria obrazów backendu"
  type        = list(string)
}

variable "instance_id" {
  description = "VM z backendem"
  type        = string
}
