#!/bin/sh
set -e

# Allinea lo schema del database (non ci sono migrazioni nel repo: usiamo db push).
# Attende che Postgres sia pronto è già gestito da docker-compose (healthcheck).
echo "[entrypoint] Applico lo schema Prisma al database..."
npx prisma db push --skip-generate

echo "[entrypoint] Avvio dell'app..."
exec "$@"
