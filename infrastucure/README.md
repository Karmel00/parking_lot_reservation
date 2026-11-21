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
  cd-runner/       konto usługowe GitHub Actions (pipeline CD)
../docker/         Dockerfile i docker-compose dla backendu (używa ich CD, nie Terraform)
../gateway/        nginx.conf bramki API (używa go CD, nie Terraform)
```

## Architektura

Ruch płynie przez trzy warstwy: internet → CloudFront (Web) → VM z backendem (App) → RDS PostgreSQL (Data). Pliki frontendu CloudFront pobiera z prywatnego bucketu S3, a ścieżki `/api/*` kieruje do VM.

## Bezpieczeństwo sieci

Każda warstwa przyjmuje ruch tylko z warstwy przed nią (zasada najmniejszych uprawnień). Reguły są zdefiniowane w Terraformie (`modules/frontend`, `modules/compute`, `modules/vpc`).

### Warstwa Web (CloudFront + S3)

| Kierunek | Port | Źródło / cel | Uwagi |
| --- | --- | --- | --- |
| Inbound | 443 (HTTPS) | Internet (0.0.0.0/0) | certyfikat CloudFront (TLS) |
| Inbound | 80 (HTTP) | Internet (0.0.0.0/0) | przekierowanie 301 na HTTPS (`redirect-to-https`) |
| Outbound | S3 | bucket frontendu | bucket prywatny, dostęp tylko z tej dystrybucji (OAC), publiczny dostęp zablokowany |
| Outbound | 80 (HTTP) | VM z backendem | tylko ścieżki `/api/*` |

### Warstwa App (VM z backendem: `sg-edge` + `sg-app`)

| Kierunek | Port | Źródło / cel | Uwagi |
| --- | --- | --- | --- |
| Inbound | 80 | lista prefiksów CloudFront (`sg-edge`) | ruch z internetu poza CloudFront jest odrzucany |
| Inbound | 22 (SSH), 3389 (RDP) | brak reguły | zarządzanie przez AWS SSM Session Manager |
| Outbound | 443 (HTTPS) | 0.0.0.0/0 (`sg-edge`) | ECR, SSM, logi CloudWatch, obrazy Dockera, pakiety |
| Outbound | 5432 | tylko `sg-db` (`sg-app`) | połączenie z bazą |

### Warstwa Data (RDS PostgreSQL: `sg-db`)

| Kierunek | Port | Źródło / cel | Uwagi |
| --- | --- | --- | --- |
| Inbound | 5432 | tylko `sg-app` | jedyna reguła wejściowa |
| Inbound | dowolny | 0.0.0.0/0 | brak reguły; baza bez publicznego adresu (`publicly_accessible = false`) |
| Outbound | brak | — | grupa nie ma reguł wychodzących |

Baza stoi w dwóch podsieciach prywatnych bez trasy do internetu, a dane są szyfrowane na dysku (`storage_encrypted = true`).

### Znane ograniczenia

Dwa ograniczenia zostają świadomie, ze względu na budżet projektu:

- **VM z backendem stoi w podsieci publicznej**, bo podsieć prywatna nie ma wyjścia do internetu. Przeniesienie VM wymaga bramy NAT. Ryzyko ograniczają reguły: VM przyjmuje ruch wyłącznie z CloudFront, nie ma otwartego SSH, a ruch wychodzący jest ograniczony do HTTPS i bazy.
- **Ruch CloudFront → VM idzie po HTTP** (`http-only`). Szyfrowanie tego odcinka wymaga certyfikatu wystawionego na własną domenę.

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