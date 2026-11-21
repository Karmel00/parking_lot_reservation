variable "project" {
  description = "Prefiks nazw zasobów"
  type        = string
}

variable "region" {
  description = "Region aplikacji"
  type        = string
}

variable "app_domain" {
  description = "Domena CloudFront (bez https://)"
  type        = string
}

variable "distribution_id" {
  description = "ID dystrybucji CloudFront"
  type        = string
}

variable "instance_id" {
  description = "VM z backendem"
  type        = string
}

variable "app_log_group" {
  description = "Grupa logów kontenerów"
  type        = string
}

variable "alert_emails" {
  description = "Adresy powiadomień o awarii (wymagają potwierdzenia w mailu)"
  type        = list(string)
}
