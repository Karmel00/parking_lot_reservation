variable "project" {
  description = "Prefiks nazw"
  type        = string
}

variable "services" {
  description = "Nazwy serwisów"
  type        = list(string)
}

variable "keep_images" {
  description = "Liczba zachowanych obrazów"
  type        = number
  default     = 3
}
