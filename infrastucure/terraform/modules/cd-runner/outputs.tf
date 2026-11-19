output "user_name" {
  description = "Użytkownik IAM pipeline'u CD"
  value       = aws_iam_user.this.name
}
