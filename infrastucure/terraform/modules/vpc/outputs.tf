output "vpc_id" {
  value = aws_vpc.main.id
}

output "subnet_ids" {
  value = {
    public_web           = aws_subnet.public_web.id
    private_app          = aws_subnet.private_app.id
    private_db           = aws_subnet.private_db.id
    private_db_secondary = aws_subnet.private_db_secondary.id
  }
}

output "security_group_ids" {
  value = {
    web = aws_security_group.web.id
    app = aws_security_group.app.id
    db  = aws_security_group.db.id
  }
}

output "db_subnet_group_name" {
  value = aws_db_subnet_group.db.name
}
