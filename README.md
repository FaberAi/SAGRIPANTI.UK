# SAGRIPANTI.UK

Sito ufficiale del **Gruppo Sagripanti** — la holding che riunisce tecnologia,
editoria, ospitalità e servizi sotto un solo tetto.

## Cos'è

Vetrina pubblica del Gruppo + **Trading Terminal** riservato (login).

- **Landing** (`/`): presentazione del Gruppo, divisioni, fondatore, percorso.
- **Trading Terminal** (`/login` → `/terminal`, `/portfolio`, `/bots`, `/chart/[symbol]`):
  dati di mercato, grafici, backtest e bot.

## Stack

- [Next.js 15](https://nextjs.org/) (App Router) · React 19 · TypeScript
- Tailwind CSS 4
- Prisma (`@prisma/client`)
- framer-motion (animazioni della vetrina)
- lightweight-charts / recharts · yahoo-finance2 (dati di mercato)

## Sviluppo

```bash
npm install        # installa le dipendenze (postinstall: prisma generate)
npm run dev        # avvio in locale su http://localhost:3000
npm run build      # build di produzione (prisma generate && next build)
npm run start      # avvio della build
npm run lint       # ESLint
```

## Deploy

Hosting su **Vercel**: ogni push/merge su `main` fa partire un deploy di
produzione su [sagripanti.uk](https://sagripanti.uk).

## Struttura

```
src/
  app/
    page.tsx              # landing del Gruppo
    (terminal)/           # area riservata: terminal, portfolio, bots, chart
    api/                  # auth, market, trade, portfolio, bot, backtest, cron
  components/
    IntroSplash.tsx       # splash d'ingresso "Matrix" su canvas
    ...
  lib/                    # auth, market, strategy, indicators, bot-engine, ...
prisma/                   # schema del database
```
