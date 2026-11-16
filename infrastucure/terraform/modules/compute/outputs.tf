output "instance_id" {
  value = aws_instance.this.id
}

output "public_ip" {
  value = aws_eip.this.public_ip
}

output "public_dns" {
  description = "Origin CloudFront"
  value       = aws_eip.this.public_dns
}
