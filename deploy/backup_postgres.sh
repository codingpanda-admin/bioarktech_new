#!/bin/bash
# Installed at /root/scripts/backup_postgres.sh on the server. Runs daily via
# cron (0 8 * * *), and is also called at the start of ci_deploy_production.sh
# and ci_migrate_production.sh so every production deploy/migration always
# has a fresh backup right before it, regardless of the daily schedule.
set -euo pipefail

BACKUP_DIR="/root/backups/postgres"
MEDIA_BACKUP_DIR="/root/backups/media"
CONTAINER="bioark_postgres"
DB_NAME="bioone"
DB_USER="postgres"
KEEP_LAST=20
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR" "$MEDIA_BACKUP_DIR"

# --- Postgres dump ---
docker exec "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" -F c -f "/tmp/bioark_backup_${TIMESTAMP}.dump"
docker cp "$CONTAINER:/tmp/bioark_backup_${TIMESTAMP}.dump" "$BACKUP_DIR/bioark_${TIMESTAMP}.dump"
docker exec "$CONTAINER" rm "/tmp/bioark_backup_${TIMESTAMP}.dump"

# --- Rotate: keep only the most recent KEEP_LAST dumps, regardless of age.
# Frequent deploys create frequent backups on purpose (safety net per
# deploy) - this is what keeps that from growing disk usage unbounded,
# instead of a pure time-based cutoff that either keeps too many on a busy
# day or deletes the only backup on a quiet one. ---
ls -1t "$BACKUP_DIR"/bioark_*.dump 2>/dev/null | tail -n +$((KEEP_LAST + 1)) | xargs -r rm -f

# --- Media mirror (append-only: never deletes, protects against accidental
# --delete syncs elsewhere; source of truth stays production media/) ---
rsync -a /root/new_site/bioarktech_new/media/ "$MEDIA_BACKUP_DIR/"

echo "$(date -u +%FT%TZ) OK backup=$BACKUP_DIR/bioark_${TIMESTAMP}.dump media_mirror=$MEDIA_BACKUP_DIR" >> "$BACKUP_DIR/backup.log"
