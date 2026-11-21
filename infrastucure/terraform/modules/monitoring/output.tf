output "dashboard_name" {
  value = aws_cloudwatch_dashboard.main.dashboard_name
}

output "health_check_id" {
  value = aws_route53_health_check.api.id
}
