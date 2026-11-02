# Gymverse deployment (Neon + Render)

## 1. Database (Neon)

1. Create a Neon project and copy the pooled connection string.
2. Set `DATABASE_URL` (include `?sslmode=require`).
3. From CI or a laptop with the repo:

```bash
export DATABASE_URL="postgresql://..."
pnpm install
pnpm db:migrate:deploy   # or pnpm db:push for first bring-up
pnpm db:seed             # optional demo data — skip in production
```

## 2. API service (Render)

- **Root directory:** repo root (or `apps/api` with careful env)
- **Build command:**
  ```bash
  pnpm install && pnpm --filter @gymverse/shared-types build && pnpm --filter @gymverse/shared-validation build && pnpm db:generate && pnpm --filter @gymverse/api build
  ```
- **Start command:** `pnpm --filter @gymverse/api start:prod`
- **Health check:** `GET /api/health`
- **Env vars:** copy from `.env.example` (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `API_PORT=4000`, optional SMTP/Cloudinary)

Set `CORS_ORIGIN` to your web URL (e.g. `https://gymverse-web.onrender.com`).

## 3. Web service (Render)

- **Build command:**
  ```bash
  pnpm install && pnpm --filter @gymverse/shared-types build && pnpm --filter @gymverse/shared-validation build && pnpm --filter @gymverse/web build
  ```
- **Start command:** `pnpm --filter @gymverse/web start`
- **Env vars:**
  - `NEXT_PUBLIC_API_URL=https://your-api.onrender.com`
  - `NEXT_PUBLIC_APP_URL=https://your-web.onrender.com`

## 4. Free-tier notes

- Render free web services spin down after idle; first request is slow.
- Neon free tier may suspend after inactivity; cold starts apply.
- Keep notification cron enabled; with free dynos it only runs while the API is awake.
- Do not commit secrets — use Render/Neon dashboards.

## 5. Connecting a GitHub remote

If this tree was created without a remote:

```bash
gh repo create gymverse --private --source=. --remote=origin --push
# or
git remote add origin git@github.com:YOUR_ORG/gymverse.git
git push -u origin HEAD
```
