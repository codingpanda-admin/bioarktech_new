#!/bin/bash
# Restricted script for the GitHub Actions PRODUCTION MIGRATE deploy key.
# NOT active yet - see README.md in this directory. The only script in this
# repo that is ever allowed to run `manage.py migrate` against the
# production database. Always backs up first.
set -euo pipefail

/root/scripts/backup_postgres.sh

cd /root/new_site/bioarktech_new
docker compose exec -T backend python manage.py migrate

echo "$(date -u +%FT%TZ) production MIGRATE applied" >> /root/backups/postgres/backup.log
