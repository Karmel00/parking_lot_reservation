output "initial_passwords" {
  value     = { for k, p in aws_iam_user_login_profile.this : k => p.password }
  sensitive = true
}
