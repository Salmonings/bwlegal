# Branch Compliance Document Manager

An internal web app for a multi-branch business to track the legal and
compliance documents that must stay current at every branch — contracts,
licenses, certificates, and employee paperwork — with expiry tracking and
automated reminders.

- **Branch managers** maintain their own branch's documents and employees.
- **Legal admins** see a compliance matrix across all branches, manage the
  document-type catalog, branches, and users, and receive reminder emails
  for everything expiring soon or already expired.

Arabic-only UI with right-to-left layout.

## Tech stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [Supabase](https://supabase.com) — Postgres, auth, and private file storage
- Row-Level Security enforced at the database level
- [Resend](https://resend.com) for reminder emails
- A small cron sidecar container for the daily reminder job

## Local development

1. Install [the Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
   and start a local stack:
   ```bash
   npx supabase start
   ```
2. Copy `.env.local.example` to `.env.local` and fill in the values printed
   by `supabase start` (URL, anon key, service role key).
3. Install dependencies and run the dev server:
   ```bash
   npm install
   npm run dev
   ```
4. Seed a couple of test accounts (`admin@bwlegal.local` /
   `manager.branch1@bwlegal.local`, both with password `Password123!`):
   ```bash
   npm run seed:users
   npm run seed:documents   # optional: sample documents across statuses
   ```
5. Open [http://localhost:3000](http://localhost:3000).

## Database

Schema, RLS policies, storage bucket setup, and seed data all live under
[`supabase/migrations`](supabase/migrations) and
[`supabase/seed.sql`](supabase/seed.sql) — applied automatically by
`supabase start` / `supabase db reset`.

## Deploying

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for a self-hosted Docker + Nginx +
self-hosted Supabase runbook.
