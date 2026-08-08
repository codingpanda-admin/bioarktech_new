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
# Guardrails, in order:
#   1. Fresh DB backup FIRST, every time, even though this script never
#      touches the schema - "just in case" (container restarts, bad image,
#      etc). If the backup itself fails, `set -e` stops everything here -
#      nothing gets deployed on top of an unconfirmed backup.
#   2. Tags the currently-running images as :previous before building the
#      new ones, so a bad deploy can be rolled back to exactly what was
#      running a moment ago - not an older git commit, the actual last-good
#      container images.
#   3. After bringing the new containers up, health-checks the live site
#      (HTTP 200) and container status. On failure, automatically rolls
#      back to :previous and re-verifies - then still exits non-zero so
#      the GitHub Actions run shows red and whoever is watching gets
#      pinged, even though the site is already back up by the time they
#      look.
#
# Tracks `main` (the designated production branch), not fusion-frontend-dev.
set -euo pipefail

SITE_URL="https://www.bioarktech.com"
HEALTH_RETRIES=10
HEALTH_DELAY=3

/root/scripts/backup_postgres.sh

cd /root/new_site/bioarktech_new

# --- Tag current images as :previous for rollback (no-op if this is the
# very first deploy and the images don't exist yet) ---
docker tag bioarktech_new-backend:latest bioarktech_new-backend:previous 2>/dev/null || true
docker tag bioarktech_new-frontend:latest bioarktech_new-frontend:previous 2>/dev/null || true

git fetch origin main
git checkout origin/main -- \
  backend frontend db-conversion \
  docker-compose.yml products.json reagents.json services.json

docker compose build backend frontend
docker compose up -d backend frontend

# --- Health check ---
healthy=0
for i in $(seq 1 "$HEALTH_RETRIES"); do
  sleep "$HEALTH_DELAY"
  code=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL" || echo "000")
  backend_state=$(docker inspect -f '{{.State.Status}}' bioark_backend 2>/dev/null || echo "missing")
  frontend_state=$(docker inspect -f '{{.State.Status}}' bioark_frontend 2>/dev/null || echo "missing")
  if [ "$code" = "200" ] && [ "$backend_state" = "running" ] && [ "$frontend_state" = "running" ]; then
    healthy=1
    break
  fi
  echo "Health check attempt $i/$HEALTH_RETRIES: site=$code backend=$backend_state frontend=$frontend_state"
done

if [ "$healthy" = "1" ]; then
  echo "$(date -u +%FT%TZ) production CODE deploy OK ($(git rev-parse --short origin/main)) - migrations NOT applied" >> /root/backups/postgres/backup.log
  exit 0
fi

# --- Health check failed: automatic rollback ---
echo "Health check FAILED after deploy - rolling back to previous images"
docker tag bioarktech_new-backend:previous bioarktech_new-backend:latest 2>/dev/null || true
docker tag bioarktech_new-frontend:previous bioarktech_new-frontend:latest 2>/dev/null || true
docker compose up -d backend frontend

sleep "$HEALTH_DELAY"
rollback_code=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL" || echo "000")
echo "$(date -u +%FT%TZ) production CODE deploy FAILED health check ($(git rev-parse --short origin/main)) - rolled back automatically, site now returns $rollback_code" >> /root/backups/postgres/backup.log

exit 1
