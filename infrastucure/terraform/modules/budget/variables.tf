variable "project" {
  description = "Prefiks nazw"
  type        = string
}

variable "limit_usd" {
  description = "Miesięczny limit (USD)"
  type        = number
}

variable "emails" {
  description = "Adresy alertów"
  type        = list(string)
}
