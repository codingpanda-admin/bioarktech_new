#!/bin/bash
# Restricted deploy script for the GitHub Actions staging deploy key.
# Deployed at /root/scripts/ci_deploy_staging.sh on the server, bound to a
# dedicated SSH key via a `command=` restriction in authorized_keys so that
# key can never do anything else, even if the secret leaks.
#
# Only ever touches backend/, frontend/, db-conversion/ and the staging
# compose file. Never touches media/ (tracked in git, but real uploads
# live there too) and never touches production.
set -euo pipefail

cd /root/bioarktech-test

git fetch origin fusion-frontend-dev
git checkout origin/fusion-frontend-dev -- \
  backend frontend db-conversion \
  docker-compose.staging.yml products.json reagents.json services.json

docker compose build
docker compose up -d
sleep 5
docker compose exec -T backend python manage.py migrate

echo "$(date -u +%FT%TZ) staging deploy OK ($(git rev-parse --short origin/fusion-frontend-dev))" >> /root/backups/postgres/backup.log
