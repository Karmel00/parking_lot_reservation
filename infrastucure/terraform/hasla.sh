#!/usr/bin/env bash
# Dane logowania: ./hasla.sh [UŻYTKOWNIK]
set -euo pipefail
cd "$(dirname "$0")"
url=$(terraform output -raw console_login_url)
terraform output -json iam_initial_passwords | jq -r --arg u "${1:-}" --arg url "$url" \
  'to_entries[] | select($u == "" or .key == $u) | "\(.key)\n  Link:  \($url)\n  Login: \(.key)\n  Hasło: \(.value)\n"'
