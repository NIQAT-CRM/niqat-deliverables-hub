# Niqat Deliverables Hub — Frontend

Centralized internal hub for lecturer profiles, deliverables, and feedback.

**Stack:** Next.js 15 (App Router) · Supabase (Auth/DB/Storage/RLS) · Vercel
**Supabase project:** `niqat-deliverables-hub` (ref: `dasqlwxlpycjhjyhnkcp`)

---

## What's in this build (Step 1.0 — Foundation)

- Next.js App Router + TypeScript + Tailwind, self-hosted Manrope font (no external font calls)
- Niqat theme: white/light surfaces, `#FF6600` as the single accent, black ink
- Logo in the header + Niqat icon as the browser favicon
- Supabase SSR wiring: browser client, server client, and session-refresh middleware
- Route protection: unauthenticated users are redirected to `/login`
- Email + password sign-in and sign-out (works for both provisioning models)
- A dashboard that reads the signed-in user's role from the `users` table

## Run locally

```bash
npm install
cp .env.example .env.local     # then fill in the two keys (see below)
npm run dev                     # http://localhost:3000
```

## Environment variables

| Variable | Where to get it | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | already set: `https://dasqlwxlpycjhjyhnkcp.supabase.co` | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon/publishable key | public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role key | **secret, server only** |

The service-role key is only used later (Step 1.4) for admin provisioning of lecturers. Never prefix it with `NEXT_PUBLIC` and never import it into a client component.

## Deploy (Vercel)

1. Push this repo to GitHub.
2. In Vercel → New Project → import the repo (framework auto-detected: Next.js).
3. Add the three environment variables above under Project → Settings → Environment Variables.
4. Deploy.
