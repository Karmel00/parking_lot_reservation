variable "users" {
  description = "Użytkownicy i ich polityki"
  type = map(object({
    policies = list(string)
  }))
}

variable "policy_arns" {
  description = "Nazwa polityki -> ARN"
  type        = map(string)
}

variable "self_service_policy_arn" {
  description = "ARN polityki self-service"
  type        = string
}

