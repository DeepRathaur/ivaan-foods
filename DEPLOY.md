# Deploy Ivaan Foods (Vercel + Postgres)

Use this checklist to run the app on **Vercel** with a hosted **PostgreSQL** database for testing. Upgrade to paid Vercel or a larger DB plan when you outgrow free tiers.

## Prerequisites

- Git repository (GitHub, GitLab, or Bitbucket) connected to Vercel
- A [Vercel](https://vercel.com) account
- A Postgres instance (free tier is enough for testing)

### Recommended Postgres providers (testing)

| Provider   | Notes |
|-----------|--------|
| [Neon](https://neon.tech) | Serverless Postgres; use the **pooled** / “serverless” connection string for `DATABASE_URL`. |
| [Supabase](https://supabase.com) | **Settings → Database**: use **Transaction pooler** URI on Vercel (`…pooler.supabase.com:6543`); direct `db.<ref>.supabase.co:5432` is fine locally. URL-encode the DB password (`@` → `%40`, `%` → `%25`). Optional: `NEXT_PUBLIC_SUPABASE_URL` + publishable key if you add the Supabase client later. |
| [Railway](https://railway.app) / [Render](https://render.com) | Managed Postgres with a public connection string. |

Use a connection string that supports **SSL** if the host requires it (append `sslmode=require` for Supabase).

---

## 1. Create the database

1. Create a new database/project in your provider.
2. Copy the **Postgres connection URI** (role, password, host, database name).
3. Prefer a **pooler** or **serverless** URL on Neon so short-lived Vercel functions do not exhaust connections.

---

## 2. Apply schema and seed (one-time, from your machine)

Point Prisma at the **same** database you will use in production, then push the schema and optionally load seed data.

**PowerShell (Windows):**

```powershell
$env:DATABASE_URL = "postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
npx prisma db push
npm run db:seed
```

**macOS / Linux:**

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
npx prisma db push
npm run db:seed
```

- `db push` syncs your Prisma schema to the remote database (good for testing). For long-term production, consider [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate).
- `db:seed` creates demo users/items if your `prisma/seed.ts` is set up for that.

---

## 3. Create the Vercel project

1. In Vercel: **Add New → Project** and import this repository.
2. **Framework Preset:** Next.js (default).
3. **Build command:** `npm run build` (default). `postinstall` already runs `prisma generate`.
4. **Environment variables** (Settings → Environment Variables). Add **`DATABASE_URL` (and `AUTH_*`) for every environment you use** — Production **and** Preview — or builds can fail or previews cannot reach the DB.

| Name | Value | Required |
|------|--------|----------|
| `DATABASE_URL` | Same URI as step 2 | Yes (all envs: Production, Preview, Development) |
| `AUTH_SECRET` | Long random string | Yes |
| `AUTH_URL` | `https://your-project.vercel.app` (your real URL) | Yes for stable auth in production |

Generate `AUTH_SECRET`:

```bash
npx auth secret
```

Or:

```bash
openssl rand -base64 32
```

Set `AUTH_URL` to your **canonical** site URL (no trailing slash), e.g. `https://ivaan-foods.vercel.app` or your custom domain.

---

## 4. Deploy

1. Click **Deploy** (or push to the branch Vercel watches).
2. Wait for the build to finish. The first deploy may succeed before `AUTH_URL` is set; add it and **Redeploy** if login or redirects misbehave.

---

## 5. After deploy

- Open the production URL and sign in with a seeded user (or create one via seed).
- Smoke-test **login**, **POS**, and **dashboard**.
- If you use the Capacitor Android app, set `server.url` in `capacitor.config.json` to this HTTPS URL and run `npx cap sync` (see `.env.example`).

---

## Troubleshooting

### “There is a problem with the server configuration” (after login)

Auth.js shows this when **`AUTH_SECRET` is missing or empty** in the environment that runs your deployment (almost always **Production** or **Preview** on Vercel).

1. Vercel → **Project → Settings → Environment Variables**.
2. Add **`AUTH_SECRET`** with a long random value (`npx auth secret` or `openssl rand -base64 32`).
3. Enable it for **Production** and **Preview** (each environment is separate — a variable only on “Development” does **not** apply to deployed URLs).
4. Add **`AUTH_URL`** = your live site origin, **no trailing slash** (e.g. `https://your-app.vercel.app` or your custom domain). Use the **same** kind of URL you open in the browser. For **Preview** deploys, either set `AUTH_URL` per preview (hard) or rely on `trustHost` + `VERCEL` (already enabled in code); **Preview** still needs **`AUTH_SECRET`**.
5. **Redeploy** after saving variables.

You can also set **`NEXTAUTH_SECRET`** to the same value (Auth.js accepts it as an alias for `AUTH_SECRET`).

---

| Issue | What to check |
|--------|----------------|
| Build fails on Prisma | Ensure `postinstall` runs (`prisma generate`). `DATABASE_URL` is **not** required at build time for generate only; if you added a build step that connects to DB, fix or remove it. |
| `P1001` / cannot reach database | Wrong `DATABASE_URL`, IP allowlist (some hosts allow all by default), or missing `sslmode=require`. |
| Auth / redirect loops | `AUTH_URL` must match the URL you use in the browser. Redeploy after changing env vars. |
| Too many DB connections | Use a **pooled** / serverless connection string (Neon pooler, etc.). |

---

## Paying later

- **Vercel:** Pro adds bandwidth, build minutes, and team features.
- **Database:** Paid tiers add storage, connections, backups, and support.

---

## Related files

- `.env.example` — variable names and hints
- `prisma/schema.prisma` — database schema
- `src/auth.ts` — Auth.js (`trustHost: true` helps on Vercel)
