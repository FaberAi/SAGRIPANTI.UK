# Deploy su box.sagripanti.uk (Hetzner + Docker)

Guida per ospitare l'app su una box Hetzner, raggiungibile su
**https://box.sagripanti.uk**, separata dal deploy Vercel di `sagripanti.uk`.

Lo stack (vedi `docker-compose.yml`):

- **Postgres 16** — database (volume persistente `db-data`)
- **app** — Next.js in produzione (immagine costruita dal `Dockerfile`)
- **Caddy** — reverse proxy con **HTTPS automatico** (Let's Encrypt)
- **cron** — replica del Vercel Cron: chiama `/api/cron/bots` ogni giorno alle 22:00 UTC

---

## 1. DNS su Cloudflare

Aggiungi un record per il sottodominio che punta all'IP pubblico della box:

| Tipo | Nome  | Contenuto         | Proxy        |
|------|-------|-------------------|--------------|
| A    | `box` | `IP.DELLA.BOX`    | **DNS only** (nuvola grigia) |

> Tieni il proxy **disattivato (DNS only)** almeno al primo avvio: così Caddy
> ottiene il certificato Let's Encrypt senza interferenze. Volendo, dopo puoi
> riattivare il proxy Cloudflare e usare la modalità SSL **Full (strict)**.

(Se la box è IPv6, aggiungi anche un record `AAAA`.)

---

## 2. Preparazione della box (Ubuntu 24.04)

Collegati via SSH come root e prepara il sistema:

```bash
# Utente non-root con sudo
adduser deploy && usermod -aG sudo deploy

# Firewall: SSH + HTTP + HTTPS
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable

# Docker + plugin compose
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploy
```

Poi prosegui come utente `deploy` (`su - deploy`).

---

## 3. Codice + variabili d'ambiente

```bash
git clone https://github.com/faberai/sagripanti.uk.git
cd sagripanti.uk

cp .env.box.example .env
nano .env            # compila i valori (vedi sotto)
```

Variabili da impostare in `.env`:

| Variabile | Cosa è |
|-----------|--------|
| `SITE_DOMAIN` | `box.sagripanti.uk` |
| `ACME_EMAIL` | email per i certificati Let's Encrypt |
| `POSTGRES_PASSWORD` | password robusta per il DB |
| `AUTH_TOKEN` | token di autenticazione dell'app |
| `CRON_SECRET` | secret per proteggere `/api/cron/bots` |
| `TELEGRAM_BOT_TOKEN` / `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | solo se usi le notifiche Telegram (altrimenti vuoti) |

Genera i secret in fretta:

```bash
openssl rand -hex 32   # ripeti per AUTH_TOKEN, CRON_SECRET, password
```

---

## 4. Avvio

```bash
docker compose up -d --build
```

Al primo avvio: build dell'immagine, partenza di Postgres, `prisma db push`
(crea le tabelle), poi Caddy richiede il certificato TLS.

Controlli utili:

```bash
docker compose ps            # stato dei servizi
docker compose logs -f app   # log dell'app
docker compose logs -f caddy # log del certificato/HTTPS
```

Quando il DNS è propagato, apri **https://box.sagripanti.uk**.

---

## 5. Operazioni comuni

```bash
# Aggiornare dopo nuovi commit
git pull && docker compose up -d --build

# Lanciare i bot a mano (test del cron)
docker compose exec app sh -c \
  'curl -fsS -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/bots'

# Backup del database
docker compose exec db pg_dump -U sagripanti sagripanti > backup_$(date +%F).sql

# Aprire una shell psql
docker compose exec db psql -U sagripanti -d sagripanti
```

---

## Note

- **Schema DB:** il repo non ha migrazioni Prisma, quindi all'avvio si usa
  `prisma db push`. Se in futuro introduci `prisma/migrations/`, sostituisci
  in `docker-entrypoint.sh` con `npx prisma migrate deploy`.
- **Cron orario:** lo scheduler gira in UTC (come su Vercel). Per orario
  italiano cambia l'ora nel crontab del servizio `cron` in `docker-compose.yml`.
- **Primo utente / admin:** crea gli utenti tramite il flusso dell'app o con
  `docker compose exec app npx prisma studio` (richiede port-forward) / `psql`.
