# --- Immagine per self-hosting su box.sagripanti.uk (Hetzner) ---
# Build multi-stage: dipendenze -> build Next.js -> runtime.
# Pensata per girare dietro Caddy (vedi docker-compose.yml + Caddyfile).

FROM node:20-bookworm-slim AS base
# openssl serve a Prisma; ca-certificates per le chiamate esterne (Yahoo/CoinGecko/Telegram).
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# --- Dipendenze (incluse devDependencies: servono per il build e per la CLI prisma) ---
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# --- Build dell'app ---
FROM deps AS builder
COPY . .
# NEXT_PUBLIC_* va iniettato a build-time (finisce nel bundle client).
ARG NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=""
ENV NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=$NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
# DATABASE_URL fittizio: `prisma generate` non si connette, ma evita sorprese a build-time.
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
ENV DIRECT_URL="postgresql://user:pass@localhost:5432/db"
RUN npm run build

# --- Runtime ---
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Copio l'intera app costruita (node_modules incluso: tiene la CLI prisma per `db push`).
COPY --from=builder /app ./
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
