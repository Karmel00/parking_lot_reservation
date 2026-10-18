# parking-lot-reservation – Terraform

Konto `907813425125`, region `eu-west-1`, Terraform `1.16.6`.

```
main.tf            wersje, backend S3, provider, moduły
variables.tf       zmienne
outputs.tf         outputy
terraform.tfvars   użytkownicy
hasla.sh           dane logowania do przekazania
modules/
  policies/        polityki IAM
  iam/             użytkownicy i hasła
  vpc/             sieć
```

## Uruchomienie

```bash
export AWS_PROFILE=parking-lot
terraform init
terraform plan
terraform apply
```

## Użytkownicy

Edytuj `terraform.tfvars` i zrób `terraform apply`. Polityki: `admin`, `frontend`, `backend`, `db`.

```hcl
Ania = { policies = ["frontend"] }
```

## Przekazanie konta

```bash
./hasla.sh          # wszyscy
./hasla.sh Michal   # jedna osoba (wymaga jq)
```

Link i login wyślij zwykłym kanałem, hasło osobno jednorazowym linkiem (np. Bitwarden Send). Przy pierwszym logowaniu użytkownik ustawia własne hasło.

Reset hasła:

```bash
terraform apply -replace='module.iam.aws_iam_user_login_profile.this["Michal"]'
```

## Rozbudowa

- Zasoby nazywaj z prefiksem `parking-lot-reservation-`, bo na tym opierają się polityki.
- Nowy komponent = nowy moduł w `modules/` + wywołanie w `main.tf`.
- Nowa polityka = dokument w `modules/policies/main.tf` + wpis w `documents` i `role_policies`.
- Zmiana wersji Terraforma: `main.tf` i `.terraform-version` razem.
