# Pipeline de deploy - estado

## Producción (main -> /root/new_site/bioarktech_new) - ACTIVO

`deploy-production.yml` y `migrate-production.yml` están funcionando de
punta a punta desde GitHub Actions (verificado 2026-08-04). Ambos son
`workflow_dispatch` manual, gated por el Environment `production`.

- `PRODUCTION_DEPLOY_SSH_KEY` -> `command="/root/scripts/ci_deploy_production.sh"`
  Solo puede desplegar código (backend/frontend/db-conversion) desde
  `origin/main`. Nunca toca `media/` ni el volumen de Postgres, nunca
  corre `manage.py migrate`.
- `PRODUCTION_MIGRATE_SSH_KEY` -> `command="/root/scripts/ci_migrate_production.sh"`
  Único camino que corre `manage.py migrate` contra producción. Siempre
  hace un `pg_dump` de respaldo justo antes.

Flujo: se trabaja en `fusion-frontend-dev` -> PR a `main` -> merge a `main`
es lo que se despliega a producción, disparando `deploy-production.yml`
manualmente desde Actions (o automatizar en el futuro si se quiere).

## Staging (fusion-frontend-dev -> /root/bioarktech-test) - ACTIVO

`deploy-staging.yml` está funcionando: `STAGING_DEPLOY_SSH_KEY` confirmado
en GitHub Secrets. Cada push a `fusion-frontend-dev` dispara deploy
automático a staging, incluyendo migraciones (seguro, no es data real).

Nota sobre corrupción de llaves SSH en GitHub Secrets: pasó dos veces en
esta sesión ("error in libcrypto"). Causa probable: algo en el copy/paste
pierde una línea o inserta caracteres. Mitigación: borrar el secret viejo
por completo antes de crear uno nuevo (no editar el existente), y contar
que el bloque tenga exactamente 7 líneas (BEGIN + 5 de datos + END).

## Lo que NUNCA hacen estos scripts

Ninguno toca `media/` ni el volumen de Postgres directamente. Solo
`ci_migrate_production.sh` corre `manage.py migrate`, y siempre hace un
backup primero. `ci_deploy_production.sh` y `ci_deploy_staging.sh` son
deploy de código puro.
