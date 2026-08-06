#!/bin/bash
# Restricted deploy script for the GitHub Actions PRODUCTION deploy key.
# Active - deployed at /root/scripts/ci_deploy_production.sh on the server,
# bound to its own dedicated SSH key via a `command=` restriction in
# authorized_keys.
#
# Deploys code only. Never touches media/, never touches the Postgres
# volume, and NEVER runs `manage.py migrate` - that only happens via
# ci_migrate_production.sh, triggered separately and manually.
#
# Takes a fresh DB backup FIRST, every time, even though this script never
# touches the schema - "just in case" (container restarts, bad image, etc.).
# backup_postgres.sh rotates old dumps by count, so this can't accumulate
# unbounded disk usage across frequent deploys.
#
# Tracks `main` (the designated production branch), not fusion-frontend-dev.
set -euo pipefail

/root/scripts/backup_postgres.sh

cd /root/new_site/bioarktech_new

git fetch origin main
git checkout origin/main -- \
  backend frontend db-conversion \
  docker-compose.yml products.json reagents.json services.json

docker compose build backend frontend
docker compose up -d backend frontend

echo "$(date -u +%FT%TZ) production CODE deploy OK ($(git rev-parse --short origin/main)) - migrations NOT applied" >> /root/backups/postgres/backup.log
