terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${var.name}-vpc" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.name}-igw" }
}

# Podsieci
resource "aws_subnet" "public_web" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_web_cidr
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = true

  tags = { Name = "${var.name}-public-web" }
}

resource "aws_subnet" "private_app" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_app_cidr
  availability_zone = var.availability_zone

  tags = { Name = "${var.name}-private-app" }
}

resource "aws_subnet" "private_db" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_db_cidr
  availability_zone = var.availability_zone

  tags = { Name = "${var.name}-private-db" }
}

# RDS wymaga podsieci w 2 AZ
resource "aws_subnet" "private_db_secondary" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_db_secondary_cidr
  availability_zone = var.availability_zone_secondary

  tags = { Name = "${var.name}-private-db-secondary" }
}

resource "aws_db_subnet_group" "db" {
  name        = "${var.name}-db"
  description = "Podsieci bazy danych (2 AZ)"
  subnet_ids  = [aws_subnet.private_db.id, aws_subnet.private_db_secondary.id]

  tags = { Name = "${var.name}-db-subnet-group" }
}

# Routing
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.name}-rt-public" }
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

resource "aws_route_table_association" "public_web" {
  subnet_id      = aws_subnet.public_web.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private_app" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.name}-rt-private-app" }
}

resource "aws_route_table_association" "private_app" {
  subnet_id      = aws_subnet.private_app.id
  route_table_id = aws_route_table.private_app.id
}

resource "aws_route_table" "private_db" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.name}-rt-private-db" }
}

resource "aws_route_table_association" "private_db" {
  subnet_id      = aws_subnet.private_db.id
  route_table_id = aws_route_table.private_db.id
}

resource "aws_route_table_association" "private_db_secondary" {
  subnet_id      = aws_subnet.private_db_secondary.id
  route_table_id = aws_route_table.private_db.id
}

# Security groups: internet -> web -> app -> db
resource "aws_security_group" "web" {
  name        = "${var.name}-web"
  description = "Web tier: HTTP/HTTPS z internetu"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${var.name}-sg-web" }
}

resource "aws_vpc_security_group_ingress_rule" "web_http" {
  security_group_id = aws_security_group.web.id
  description       = "HTTP z internetu"
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "web_https" {
  security_group_id = aws_security_group.web.id
  description       = "HTTPS z internetu"
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "web_all" {
  security_group_id = aws_security_group.web.id
  description       = "Caly ruch wychodzacy"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

resource "aws_security_group" "app" {
  name        = "${var.name}-app"
  description = "App tier: ruch tylko z web SG"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${var.name}-sg-app" }
}

resource "aws_vpc_security_group_ingress_rule" "app_from_web" {
  security_group_id            = aws_security_group.app.id
  description                  = "API tylko z web SG"
  referenced_security_group_id = aws_security_group.web.id
  from_port                    = var.app_port
  to_port                      = var.app_port
  ip_protocol                  = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "app_all" {
  security_group_id = aws_security_group.app.id
  description       = "Caly ruch wychodzacy"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

resource "aws_security_group" "db" {
  name        = "${var.name}-db"
  description = "DB tier: ruch tylko z app SG"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${var.name}-sg-db" }
}

resource "aws_vpc_security_group_ingress_rule" "db_from_app" {
  security_group_id            = aws_security_group.db.id
  description                  = "Baza tylko z app SG"
  referenced_security_group_id = aws_security_group.app.id
  from_port                    = var.db_port
  to_port                      = var.db_port
  ip_protocol                  = "tcp"
}

# Endpoint S3 (darmowy)
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private_app.id]

  tags = { Name = "${var.name}-vpce-s3" }
}

