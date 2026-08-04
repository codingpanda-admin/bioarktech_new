# Pipeline de deploy - estado y pasos pendientes

## Staging (fusion-frontend-dev -> /root/bioarktech-test)

Diseño completo, listo para activarse. Falta un solo paso manual porque
agregar una llave SSH nueva al servidor es una acción de seguridad que
requiere confirmación explícita:

1. Agregar esta línea a `/root/.ssh/authorized_keys` en el servidor (ver
   `bioarktech_deploy.pub` generada en esta sesión - pídele a Claude la
   llave pública, o genera una nueva):

   ```
   command="/root/scripts/ci_deploy_staging.sh",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty <PUBLIC_KEY>
   ```

   El prefijo `command=` es lo que hace esto seguro: esa llave, aunque se
   filtre, SOLO puede ejecutar ese script exacto. No da shell libre.

2. Agregar la llave PRIVADA correspondiente como secret de GitHub:
   Settings -> Secrets and variables -> Actions -> New repository secret,
   nombre `STAGING_DEPLOY_SSH_KEY`.

3. Con eso, `.github/workflows/deploy-staging.yml` ya queda funcional: cada
   push a `fusion-frontend-dev` dispara un deploy automático a staging,
   incluyendo migraciones (seguro, no es data real).

`/root/scripts/backup_postgres.sh` y `/root/scripts/ci_deploy_staging.sh` ya
están instalados y probados en el servidor.

## Producción (main -> /root/new_site/bioarktech_new)

**Intencionalmente NO activado todavía.** Requiere, en este orden:

1. Coordinar con el compañero de equipo que tiene cambios sin commitear en
   `/root/new_site/bioarktech_new/` (commit + push, o confirmar que se
   pueden descartar).
2. Formalizar `main` como la rama de producción (hoy el servidor de
   producción sigue en `fusion-frontend-dev`, igual que staging - no hay
   separación real de ramas todavía). Definir el flujo: se trabaja en
   `fusion-frontend-dev` -> se abre PR a `main` -> merge a `main` es lo que
   se despliega a producción.
3. Repetir el proceso de la llave restringida (pasos 1-2 de la sección de
   staging) dos veces, con DOS llaves separadas:
   - `PRODUCTION_DEPLOY_SSH_KEY` -> `command="/root/scripts/ci_deploy_production.sh"`
   - `PRODUCTION_MIGRATE_SSH_KEY` -> `command="/root/scripts/ci_migrate_production.sh"`
   (Separadas a propósito: la de deploy nunca puede tocar el esquema; la de
   migrate no puede desplegar código.)
4. Configurar el "Environment" `production` en GitHub con required
   reviewers, para que `deploy-production.yml` y `migrate-production.yml`
   (ambos `workflow_dispatch`) pidan aprobación humana antes de correr.
5. Subir `ci_deploy_production.sh` y `ci_migrate_production.sh` (ya
   escritos en esta carpeta) a `/root/scripts/` en el servidor.

Ninguno de estos scripts toca `media/` ni el volumen de Postgres. Solo
`ci_migrate_production.sh` corre `manage.py migrate`, y siempre hace un
backup primero.
