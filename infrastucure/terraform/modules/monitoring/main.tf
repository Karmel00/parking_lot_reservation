terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      configuration_aliases = [aws.us_east_1]
    }
  }
}

locals {
  # Wspólny warunek dla zapytań Logs Insights: tylko logi bramki nginx (JSON)
  gateway_logs = "SOURCE '${var.app_log_group}' | filter ispresent(request_time)"
}

# Sonda zdrowia: Route 53 co 30 s sprawdza /api/health przez HTTPS
resource "aws_route53_health_check" "api" {
  type              = "HTTPS"
  fqdn              = var.app_domain
  port              = 443
  resource_path     = "/api/health"
  enable_sni        = true
  request_interval  = 30
  failure_threshold = 3

  tags = { Name = "${var.project}-api-health" }
}

# Metryki Route 53 są tylko w us-east-1, więc alarm i powiadomienia też tam
resource "aws_sns_topic" "alerts" {
  provider = aws.us_east_1
  name     = "${var.project}-alerts"
}

resource "aws_sns_topic_subscription" "email" {
  provider  = aws.us_east_1
  count     = length(var.alert_emails)
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_emails[count.index]
}

resource "aws_cloudwatch_metric_alarm" "api_down" {
  provider            = aws.us_east_1
  alarm_name          = "${var.project}-api-down"
  alarm_description   = "Endpoint /api/health nie odpowiada 200"
  namespace           = "AWS/Route53"
  metric_name         = "HealthCheckStatus"
  dimensions          = { HealthCheckId = aws_route53_health_check.api.id }
  statistic           = "Minimum"
  period              = 60
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "LessThanThreshold"
  treat_missing_data  = "breaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}

# Dashboard: żądania i kody HTTP, czas odpowiedzi API, CPU, RAM, stan /health
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = var.project

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "Liczba żądań HTTP (CloudFront)"
          region  = "us-east-1"
          view    = "timeSeries"
          stat    = "Sum"
          period  = 300
          metrics = [["AWS/CloudFront", "Requests", "DistributionId", var.distribution_id, "Region", "Global"]]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "Odsetek błędów 4xx i 5xx (CloudFront, %)"
          region = "us-east-1"
          view   = "timeSeries"
          stat   = "Average"
          period = 300
          metrics = [
            ["AWS/CloudFront", "4xxErrorRate", "DistributionId", var.distribution_id, "Region", "Global"],
            ["AWS/CloudFront", "5xxErrorRate", "DistributionId", var.distribution_id, "Region", "Global"],
          ]
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "Żądania API według kodu HTTP (bramka)"
          region = var.region
          view   = "bar"
          query  = "${local.gateway_logs} | stats count(*) as zadania by status"
        }
      },
      {
        type   = "log"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "Czas odpowiedzi API (ms)"
          region = var.region
          view   = "timeSeries"
          query  = "${local.gateway_logs} | fields request_time * 1000 as ms | stats avg(ms) as sredni_ms, pct(ms, 95) as p95_ms by bin(5m)"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 8
        height = 6
        properties = {
          title   = "CPU VM (%)"
          region  = var.region
          view    = "timeSeries"
          stat    = "Average"
          period  = 300
          metrics = [["AWS/EC2", "CPUUtilization", "InstanceId", var.instance_id]]
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 12
        width  = 8
        height = 6
        properties = {
          title   = "RAM VM (%)"
          region  = var.region
          view    = "timeSeries"
          stat    = "Average"
          period  = 300
          metrics = [["CWAgent", "mem_used_percent", "InstanceId", var.instance_id]]
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 12
        width  = 8
        height = 6
        properties = {
          title   = "Stan /api/health (1 = UP)"
          region  = "us-east-1"
          view    = "timeSeries"
          stat    = "Minimum"
          period  = 60
          metrics = [["AWS/Route53", "HealthCheckStatus", "HealthCheckId", aws_route53_health_check.api.id]]
        }
      },
    ]
  })
}
