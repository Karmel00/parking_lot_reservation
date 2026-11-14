variable "project" {
  description = "Nazwa projektu"
  type        = string
}

variable "db_subnet_group_name" {
  description = "Nazwa istniejącej grupy podsieci bazodanowych"
  type        = string
}

variable "db_security_group_id" {
  description = "ID Security Group dla bazy danych"
  type        = string
}

variable "db_name" {
  description = "Nazwa początkowej bazy danych"
  type        = string
  default     = "parking_reservation"
}

variable "db_username" {
  description = "Użytkownik administratora PostgreSQL"
  type        = string
  default     = "parking_admin"
}

variable "instance_class" {
  description = "Klasa instancji RDS"
  type        = string
  default     = "db.t4g.micro"
}

variable "allocated_storage" {
  description = "Początkowa przestrzeń dyskowa w GB"
  type        = number
  default     = 20
}

variable "db_port" {
  description = "Port PostgreSQL"
  type        = number
  default     = 5432
}