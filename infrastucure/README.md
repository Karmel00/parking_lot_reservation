# INFRASTUCURE
region `eu-west-1`, Terraform `1.16.6`.

```
main.tf            wersje, backend S3, provider, moduły
variables.tf       zmienne
outputs.tf         outputy
terraform.tfvars   użytkownicy
hasla.sh           dane logowania do przekazania
modules
  policies/        polityki IAM
  iam/             użytkownicy i hasła
  vpc/             sieć
  rds/             PostgreSQL
  ecr/             repozytoria obrazów backendu
  compute/         VM z backendem (vm-init.sh.tftpl = inicjalizacja VM)
  frontend/        S3 + CloudFront
  budget/          alert kosztowy
../app/            pliki dla CI (Terraform ich nie używa)
```

## Architektura

## Inicjalizacja VM

`modules/compute/vm-init.sh.tftpl` działa raz, przy pierwszym starcie VM: instaluje Dockera i zapisuje `/opt/parking/bin/apply.sh`.

## Uruchomienie

```bash
terraform init --reconfigure
terraform plan
terraform apply
```

## Użytkownicy

Edytuj `variables.tf` i zrób `terraform apply`. Polityki: `admin`, `frontend`, `backend`, `db`.

```hcl
Ania = { policies = ["frontend"] }
```

## Przekazanie konta

```bash
./hasla.sh          # wszyscy
./hasla.sh Michal   # jedna osoba (wymaga jq)
```


Reset hasła:

```bash
terraform apply -replace='module.iam.aws_iam_user_login_profile.this["Michal"]'
```

## Rozbudowa

- Zasoby nazywaj z prefiksem `parking-lot-reservation-`, bo na tym opierają się polityki.
- Nowy komponent = nowy moduł w `modules/` + wywołanie w `main.tf`.
- Nowa polityka = dokument w `modules/policies/main.tf` + wpis w `documents` i `role_policies`.
- Zmiana wersji Terraforma: `main.tf` i `.terraform-version` razem.
