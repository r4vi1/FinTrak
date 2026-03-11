# FinTrak

> Cross-account personal finance dashboard built for India — track all your spending across banks, credit cards, and wallets in one place.

![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-orange)

---

## Why this exists

Every Indian has money scattered across 3-4 bank accounts, a couple of credit cards, and maybe a UPI wallet or two. No single bank app gives you the full picture.

FinTrak pulls transactions from all your accounts (via India's [Account Aggregator](https://sahamati.org.in/what-is-account-aggregator/) framework), dumps them into one timeline, and lets you slice the data however you want — custom categories like "Late Night Zomato" that tag transactions across *all* accounts automatically.

No more spreadsheets. No more logging into 4 different bank apps.

## What it looks like

**Dashboard** — draggable widget grid, net worth tracker, cashflow charts, recent activity

**Transactions** — unified feed from all accounts, filter by anything, grouped by date

**Categories** — create custom tags with regex/keyword rules, auto-applied to past and future transactions

**Analytics** — spending velocity, top merchants, recurring expense detection, category breakdowns

## Tech stack

| | What | Why |
|---|---|---|
| **Frontend** | React + Vite | Fast, simple, no magic |
| **Backend** | Express.js | Boring and reliable |
| **Database** | SQLite (dev) / PostgreSQL (prod) | Zero-config locally, scales when needed |
| **ORM** | Knex.js | Migrations + seeds without the ORM overhead |
| **Charts** | Recharts | Composable, works with React, looks good |
| **Bank Data** | Setu AA Gateway | RBI-regulated consent-based data access |

## Getting started

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# clone
git clone https://github.com/r4vi1/FinTrak.git
cd FinTrak

# install dependencies (root + client)
npm install
cd client && npm install && cd ..

# set up the database with seed data
npm run db:migrate
npm run db:seed

# run everything
npm run server     # API on :3001
cd client && npm run dev    # UI on :5173
```

Open [http://localhost:5173](http://localhost:5173) and you should see a fully populated dashboard with ~450 mock transactions across 5 accounts.

### Account Aggregator setup (optional)

To connect real bank accounts, you need Setu sandbox credentials:

1. Register at [bridge.setu.co](https://bridge.setu.co)
2. Create an FIU product
3. Copy credentials to `.env` (see `.env.example`)

The app works fine without this — the seed data gives you enough to explore everything.

## Project structure

```
FinTrak/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/      # Sidebar, DashboardLayout, widgets/
│   │   ├── hooks/           # useApi, useCountUp
│   │   ├── pages/           # Dashboard, Transactions, Categories, Analytics
│   │   └── lib/             # Utilities (currency formatting, etc)
│   └── index.html
├── server/                  # Express backend
│   ├── routes/              # accounts, transactions, categories, analytics, aa
│   ├── services/            # categoryEngine, setuAAService
│   └── db/
│       ├── migrations/      # Knex schema migrations
│       └── seeds/           # Mock data generator
└── package.json             # Root scripts (db:migrate, db:seed, etc)
```

## API overview

| Endpoint | What it does |
|----------|-------------|
| `GET /api/accounts` | List all linked accounts with balances |
| `GET /api/transactions` | Filterable transaction list (search, category, account, type, date) |
| `POST /api/categories` | Create custom category with auto-tagging rules |
| `GET /api/analytics/cashflow` | Monthly inflow vs outflow |
| `GET /api/analytics/spending-by-category` | Category-level breakdown |
| `GET /api/analytics/top-merchants` | Highest spending merchants |
| `GET /api/analytics/recurring` | Detected subscriptions and fixed expenses |
| `POST /api/aa/consent` | Initiate Account Aggregator consent flow |
| `POST /api/aa/consent/:id/fetch` | Fetch and normalize bank data |

Full endpoint docs are in each route file under `server/routes/`.

## The categorization engine

This is the part I'm most proud of. You define rules like:

```
Category: "Food Delivery"
Rule: merchant CONTAINS "swiggy" OR merchant CONTAINS "zomato"
```

And it instantly tags every matching transaction across all your accounts — past and present. Rules support:
- **Keyword matching** — `merchant contains "amazon"`
- **Exact match** — `merchant equals "Netflix"`
- **Regex** — `description matches /UPI.*SWIGGY/i`

New transactions from AA syncs get auto-tagged too.

## Roadmap

- [ ] Account linking flow UI (Setu consent screens embedded)
- [ ] Budget alerts and spending limits per category
- [ ] CSV/PDF export
- [ ] Multi-user support with proper auth
- [ ] Mobile-responsive layout cleanup
- [ ] PostgreSQL production config + Docker Compose

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Short version: fork, branch, PR. Keep it clean.

## License

MIT — do whatever you want with it. See [LICENSE](LICENSE).
