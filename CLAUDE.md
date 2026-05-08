# Edgebook

A crypto futures trading journal for active perpetual-futures traders. Auto-syncs CEX trades (read-only API), groups fills into positions, computes performance analytics, and runs a real-time behavioral tilt-detector. Differentiator: edge-decay analytics + trader psychology, not just P&L.

> **Mission:** Help traders find their edge and catch their tilt before it costs them money.

---

## Tech stack

| Layer | Choice |
|---|---|
| Runtime | Node 20 LTS, TypeScript 5.5+ |
| Web | Next.js 15 (App Router), React 19, Tailwind, shadcn/ui, TanStack Query, Zustand |
| API | NestJS (REST + WebSocket gateway) |
| Workers | NestJS standalone + BullMQ on Redis |
| DB | PostgreSQL 16 + TimescaleDB extension (hypertable on `fills`) |
| ORM | Prisma |
| Cache / queues | Redis 7 |
| Exchange SDK | `ccxt.pro` (primary) + per-venue native libs for perps quirks |
| AI | Anthropic Claude (primary), OpenAI fallback |
| Auth | Auth.js + custom TOTP 2FA, WebAuthn in v1 |
| Secrets | AWS KMS envelope encryption for API keys |
| Charts | TradingView Lightweight Charts + Recharts |
| Tooling | pnpm 9, Turborepo, Biome, Vitest, Playwright |
| Hosting | Vercel (web) + AWS ECS Fargate (api/worker) + RDS + S3 |
| Observability | OpenTelemetry → Grafana Cloud, Sentry |

## Repo layout

```
edgebook/
├─ apps/
│  ├─ web/          Next.js — marketing + app shell
│  ├─ api/          NestJS — REST + auth + WS
│  ├─ worker/       BullMQ workers (sync, recompute, tilt, AI)
│  └─ docs/         (later) public docs site
├─ packages/
│  ├─ db/           Prisma schema + migrations + seed
│  ├─ shared/       Zod schemas, types, domain math (R-multiple, MFE/MAE)
│  ├─ exchange/     ccxt wrappers + per-venue adapters + fixtures
│  ├─ ui/           shared React components (shadcn-based)
│  ├─ ai/           LLM clients + prompt templates + caching
│  ├─ tilt-engine/  pure rules engine — zero I/O, browser-safe
│  ├─ eslint-config/  (or biome-config)
│  └─ tsconfig/
├─ infra/           Terraform / Pulumi (AWS)
├─ .github/         CI workflows
├─ pnpm-workspace.yaml
├─ turbo.json
└─ package.json
```

## Critical invariants — DO NOT VIOLATE

1. **Fills are immutable, append-only.** Source of truth. Never `UPDATE fills` — only insert. Re-derive `positions` from fills via the FIFO inventory algorithm in `@edgebook/shared`.
2. **API keys must be read-only.** On key save, attempt a withdrawal call; if it succeeds (or returns anything other than a permission error), reject the key. Keys are envelope-encrypted with KMS data keys; plaintext lives only in worker memory during a sync.
3. **2FA is mandatory.** No path to a logged-in session without TOTP.
4. **No order placement, ever.** Edgebook reads exchange data; it never places trades. This keeps regulatory surface near-zero.
5. **`tilt-engine` and `shared` stay pure.** No Node-specific APIs, no I/O. They must run in the browser (for instant client-side rule eval) and in workers identically.
6. **Funding fees are first-class.** Stored on the position they accrued under. Don't roll them into "fees."
7. **Position recompute must be deterministic.** Same fills → same positions, byte-identical. Cache key = hash of fill IDs.

## Domain glossary

- **Fill** — single execution from an exchange (one row in `fills`).
- **Position** — lifecycle from 0 → non-zero → 0 inventory for one (account, symbol, side). Derived.
- **R-multiple** — `realized_pnl / planned_risk`. Win = +R, loss = -R.
- **MFE / MAE** — Maximum Favorable / Adverse Excursion in R during the position's life.
- **Playbook** — named strategy template with thesis + entry/exit/invalidation criteria.
- **Tilt event** — rule trigger from the tilt engine (e.g., 3 consecutive losses).
- **Edge decay** — rolling-window drop in playbook PF or expectancy vs all-time baseline.
- **Discipline score** — 0–100, derived from rule adherence + journal completion + risk discipline.

## Commands you'll use

```bash
# Install / bootstrap
pnpm install
pnpm db:generate         # prisma generate
pnpm db:migrate:dev      # apply pending migrations locally
pnpm db:seed             # demo data

# Dev (run all apps in parallel via turbo)
pnpm dev                 # web + api + worker
pnpm dev --filter=web    # one app
pnpm dev --filter=api

# Quality gates
pnpm typecheck           # tsc --noEmit across the graph
pnpm lint                # biome check
pnpm format              # biome format --write
pnpm test                # vitest
pnpm test:e2e            # playwright (web only)

# Build
pnpm build               # turbo build, cached
pnpm build --filter=api

# DB
pnpm db:migrate:new -- <name>
pnpm db:reset            # drop + remigrate + reseed (DEV ONLY)
pnpm db:studio           # prisma studio
```

## Conventions

- **TypeScript**: strict mode on. No `any` outside ad-hoc test fixtures. Prefer `unknown` and narrow.
- **Validation**: every external input passes through a Zod schema in `@edgebook/shared`. The same schema is reused on client and server.
- **Errors**: typed error classes (`ExchangeError`, `KeyScopeError`, `RuleViolation`). No string throws.
- **IDs**: `cuid2` for application IDs, `bigint` for `fills.id` only.
- **Time**: store UTC, render in user TZ. Always `TIMESTAMPTZ`.
- **Money / quantities**: never `number`. Use `bigint` (smallest unit) or a decimal library — IEEE-754 ruins position math.
- **Imports**: workspace deps via `@edgebook/<pkg>`. No deep imports across packages — public surface only.
- **Commits**: Conventional Commits. `feat(api):`, `fix(worker):`, `chore(deps):`. Squash on merge.
- **Branches**: trunk-based. Short-lived feature branches off `main`. PR + review required for `main`.
- **Tests**: every domain function in `shared` and `tilt-engine` has a unit test. Sync workers have contract tests against exchange testnets.

## Code style — anti-patterns to avoid

- ❌ Mutating `fills` rows.
- ❌ Storing exchange API secrets unencrypted, even in dev.
- ❌ Putting Node-only imports (`fs`, `crypto`, `@nestjs/*`) inside `shared`, `tilt-engine`, or `ui`.
- ❌ Using `Number` for prices, sizes, or P&L. Use `bigint` (atomic units) or a decimal lib.
- ❌ Floating-point comparisons (`a === b`) on derived metrics. Compare with epsilon.
- ❌ Mixing positions and fills in the same query without going through the recompute layer.
- ❌ Adding a new exchange without a fixtures suite under `packages/exchange/__fixtures__/<venue>/`.
- ❌ Calling LLMs from `apps/api`. All LLM calls go through the worker queue with budget guards.

## Where things live

| If you want to... | Look here |
|---|---|
| Add an exchange | `packages/exchange/src/<venue>/` + fixtures |
| Change the position math | `packages/shared/src/positions/` |
| Add a tilt rule | `packages/tilt-engine/src/rules/` |
| Modify the schema | `packages/db/prisma/schema.prisma` + new migration |
| Add an API route | `apps/api/src/<module>/` (a NestJS module) |
| Add a worker job | `apps/worker/src/jobs/` |
| Add a page | `apps/web/src/app/(app)/<route>/page.tsx` |
| Tweak a prompt | `packages/ai/src/prompts/` |
| Wire a new metric | `packages/shared/src/metrics/` then surface in `apps/web` |

## Performance budgets

- p95 dashboard load < 800ms with 10k positions
- Position recompute on a 50k-fill account < 5s
- Sync lag for active account < 60s
- WS tilt-alert latency end-to-end < 2s
- p95 API latency < 200ms (excluding LLM endpoints)

## Security notes (read before touching auth or sync code)

- Never log API keys, secrets, or full request bodies that may contain them. Use a redaction middleware.
- Withdrawal-test new keys before storing — see `packages/exchange/src/withdrawal-probe.ts`.
- Sensitive routes are rate-limited at the gateway. Don't bypass.
- Audit log table is append-only. Never `DELETE` from `audit_events`.

## Working with Claude Code

When you ask Claude to make changes:
- Reference files by full path from repo root.
- For schema changes, ask for both the Prisma migration and the corresponding Zod schema in `shared`.
- For new exchange support, ask for adapter + fixtures + tests in one PR.
- For new tilt rules, ask for the pure rule + unit tests + a counterfactual estimator.
- When in doubt, ask Claude to check the invariants list above before writing code.

## Out-of-scope (don't propose)

- Order placement / trade execution
- Custody / wallet management
- Margin or fund movement
- Public chat / social feed (mentor mode is comments only, opt-in, V2)
- Mobile native apps (mobile-responsive web only until V2)
