output "policy_arns" {
  value = merge(
    { admin = "arn:aws:iam::aws:policy/AdministratorAccess" },
    { for k in local.role_policies : k => aws_iam_policy.this[k].arn }
  )
}

output "self_service_policy_arn" {
  value = aws_iam_policy.this["self-service"].arn
}

