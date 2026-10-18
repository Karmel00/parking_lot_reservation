terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

locals {
  # Para użytkownik|polityka = jedno podpięcie
  user_policies = {
    for p in flatten([
      for user, cfg in var.users : [
        for policy in cfg.policies : { user = user, policy = policy }
      ]
    ]) : "${p.user}|${p.policy}" => p
  }
}

resource "aws_iam_user" "this" {
  for_each      = var.users
  name          = each.key
  force_destroy = true

  lifecycle {
    precondition {
      condition     = alltrue([for p in each.value.policies : contains(keys(var.policy_arns), p)])
      error_message = "Nieznana polityka u ${each.key}."
    }
  }
}

# Hasło startowe, zmiana przy pierwszym logowaniu
resource "aws_iam_user_login_profile" "this" {
  for_each                = var.users
  user                    = aws_iam_user.this[each.key].name
  password_reset_required = true

  # Bez tego apply nadpisałby hasło zmienione przez użytkownika
  lifecycle {
    ignore_changes = [password_reset_required, password_length, pgp_key]
  }
}

resource "aws_iam_user_policy_attachment" "self_service" {
  for_each   = aws_iam_user.this
  user       = each.value.name
  policy_arn = var.self_service_policy_arn
}

resource "aws_iam_user_policy_attachment" "this" {
  for_each   = local.user_policies
  user       = aws_iam_user.this[each.value.user].name
  policy_arn = var.policy_arns[each.value.policy]
}
