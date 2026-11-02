# Gymverse

Multi-gym management SaaS MVP — discover gyms, manage memberships, manual Member ID attendance, and offline payments (cash/UPI/bank transfer). **No payment gateways. No QR/biometric check-in.**

## Monorepo

```
gymverse/
  apps/web/          Next.js App Router (public site + role dashboards)
  apps/api/          NestJS REST API
  packages/shared-types/
  packages/shared-validation/
  prisma/            Schema + seed
  docs/              Deployment & architecture
```

## Stack

- Next.js 15, Tailwind CSS, TypeScript
- NestJS, Prisma, PostgreSQL (Neon-ready)
- JWT + httpOnly cookie auth, bcrypt, RBAC, gym tenant isolation

## Quick start (local)

### Prerequisites

- Node 22+, pnpm 9+
- PostgreSQL 16+

### Setup

```bash
cp .env.example .env
# edit DATABASE_URL

pnpm install
pnpm db:push          # or: pnpm db:migrate
pnpm db:seed
pnpm --filter @gymverse/shared-types build
pnpm --filter @gymverse/shared-validation build
pnpm --filter @gymverse/api dev    # :4000
pnpm --filter @gymverse/web dev    # :3000
```

### Seed credentials (password: `Password123!`)

| Role | Email | Notes |
|------|-------|-------|
| Super Admin | `admin@gymverse.app` | Platform console |
| Gym Owner | `owner@irondistrict.test` | Iron District |
| Manager | `manager@irondistrict.test` | |
| Receptionist | `front@irondistrict.test` | Attendance desk |
| Peak Form Owner | `owner@peakform.test` | Peak Form |
| Member | `member1@test.com` | Member ID `GYM-7K92P4` |

## Scripts

| Script | Purpose |
|--------|---------|
| `pnpm dev:web` / `pnpm dev:api` | Dev servers |
| `pnpm build` | Production builds |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Quality gates |
| `pnpm db:seed` | Demo data |

## Hard constraints honored

- Manual payments only (cash, UPI, bank transfer, other)
- Manual Member ID attendance only
- Server-side tenant isolation — never trust client `gymId` alone for authorization
- Dashboard KPIs queried from the database

## Deploy

See [docs/deployment.md](./docs/deployment.md) for Neon + Render.

## License

Proprietary — Gymverse MVP.
