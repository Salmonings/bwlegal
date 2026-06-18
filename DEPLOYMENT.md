# Deployment Runbook — Self-Hosted on bestway-prod

This guide is written specifically for the actual current state of
`bestway-prod`, confirmed before writing this:

- 3.7 GB RAM total, ~3.3 GB available, **no swap configured**
- Nginx 1.24.0 already running, serving an existing site (`bestway-video`,
  the WebRTC app) — we will **add** new site files alongside it, never
  touch its config
- Docker is **not installed yet**
- UFW is already active with `22, 80, 443, 3478, 3478/udp, 5349` allowed —
  already correct for what we need, no firewall changes required
- coturn is presumably running natively (not in Docker) for the WebRTC app

Because RAM is tight and shared with a live, latency-sensitive WebRTC
service, this guide deliberately runs a **trimmed** Supabase stack (just
Postgres, Auth, PostgREST, Storage, Kong) instead of every official
service, plus a swap file as an OOM safety net. Every step below is
additive — nothing here modifies the existing `bestway-video` Nginx config
or touches coturn.

Replace `yourdomain.com` / `app.yourdomain.com` / `api.yourdomain.com`
below with your real domain. Commands assume you're operating as `root`
(matching your current session) — adjust `sudo`/paths if you set up a
separate user.

---

## Phase 0 — Before you start

You need:
- A domain you control, able to add DNS records.
- A Resend account (resend.com) — free tier is fine to start.

---

## Phase 1 — DNS

At your DNS provider, point two subdomains at bestway-prod's public IP
(the same IP `bestway-video` already resolves to):

| Type | Name | Value |
|---|---|---|
| A | `app.yourdomain.com` | `<bestway-prod's public IP>` |
| A | `api.yourdomain.com` | `<bestway-prod's public IP>` |

`app.*` serves the Next.js app; `api.*` serves the Supabase API gateway
(Kong). DNS propagation can take minutes to hours — move on, Certbot will
just fail cleanly later if it hasn't propagated yet, and you can retry.

---

## Phase 2 — Swap + Docker

**Add a 4 GB swap file.** With no swap and 3.3 GB available, a memory
spike from any of these new services risks an OOM kill — possibly of
coturn or the WebRTC app, not just our new stuff. Swap doesn't add real
throughput, but it turns a hard crash into graceful (if slow) degradation:

```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h   # confirm Swap now shows ~4.0Gi
```

(75 GB disk with 66 GB free — plenty of room for this.)

**Install Docker** (confirmed not present yet):

```bash
curl -fsSL https://get.docker.com | sh
docker --version
docker compose version
```

No UFW changes needed — `80` and `443` are already allowed, and nothing
here needs a new port opened to the internet (Postgres/Kong/Studio all
stay bound to `127.0.0.1`, reached only via Nginx).

---

## Phase 3 — Self-host Supabase (trimmed)

```bash
cd ~
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
```

Open `.env` and fill in (generate strong random values with
`openssl rand -hex 32`):

- `POSTGRES_PASSWORD` — strong random password
- `JWT_SECRET` — random string, **at least 32 characters**
- `ANON_KEY` / `SERVICE_ROLE_KEY` — see below, these are JWTs signed with
  `JWT_SECRET`, not arbitrary strings
- `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` — Studio admin credentials —
  full database access, make this strong even though we're not exposing
  Studio publicly (Phase 3.3)
- `SITE_URL`, `API_EXTERNAL_URL`, `SUPABASE_PUBLIC_URL` — all set to
  `https://api.yourdomain.com`

### 3.1 — Generate ANON_KEY / SERVICE_ROLE_KEY

These must be JWTs signed with your `JWT_SECRET`, with `role: anon` and
`role: service_role` respectively. This method is correct as of this
writing, but Supabase's self-hosting setup has changed shape before — if
something about auth/JWT looks wrong on first boot, cross-check against
[supabase.com/docs/guides/self-hosting/docker](https://supabase.com/docs/guides/self-hosting/docker).

```bash
mkdir -p ~/jwtgen && cd ~/jwtgen
npm init -y >/dev/null
npm install jsonwebtoken >/dev/null

JWT_SECRET='<paste the JWT_SECRET you put in .env>' node -e "
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;
const now = Math.floor(Date.now()/1000);
const tenYears = 60*60*24*365*10;
console.log('ANON_KEY=' + jwt.sign({ role: 'anon', iss: 'supabase', iat: now, exp: now + tenYears }, secret));
console.log('SERVICE_ROLE_KEY=' + jwt.sign({ role: 'service_role', iss: 'supabase', iat: now, exp: now + tenYears }, secret));
"
```

Copy both values into `~/supabase/docker/.env` as `ANON_KEY` and
`SERVICE_ROLE_KEY`. You'll reuse these exact two values later as
`NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in the
app's own `.env.local` — they must match exactly.

### 3.2 — Bring up only the services this app uses

The official compose file defines a lot we don't need: Realtime (this app
never subscribes to anything live), Analytics/Logflare + Vector (pure
observability), Edge Functions (we don't use Supabase Functions). Rather
than hand-edit the compose file's `depends_on` chains from memory (risky —
I haven't seen your exact pulled copy, and getting that wrong on a shared
box is worse than not trying), start **only the named services**: Docker
Compose automatically starts any hard dependency a named service declares,
so this is the actual safe way to trim without touching the file:

```bash
cd ~/supabase/docker
docker compose pull
docker compose up -d db auth rest storage kong
docker compose ps
```

If something fails to start citing a missing dependency, the error will
name it — just add that service name to the `up -d` list and re-run.
That's a much safer trial-and-error path than editing YAML you can't fully
verify ahead of time.

This intentionally leaves Studio and postgres-meta stopped (saves RAM).
Bring them up only when you actually want to browse the database:

```bash
docker compose up -d studio meta
# ... do your thing ...
docker compose stop studio meta
```

### 3.3 — Confirm Kong's port, keep Studio off the public internet

Check `~/supabase/docker/docker-compose.yml`'s `kong` service `ports:`
section for which host port maps to Kong's container port `8000` (HTTP) —
this guide assumes `8000`, but versions drift; use whatever you actually
have in Phase 6.

Studio has full database access via the credentials you set above —
**never expose it through Nginx.** Access it only via an SSH tunnel when
you've started it:

```bash
# from your local machine, while studio is up on the server
ssh -L 3000:localhost:8000 root@bestway-prod
# then visit http://localhost:3000 — adjust the port if Kong's differs
```

---

## Phase 4 — Apply this app's schema

Clone this app's repo on the server:

```bash
cd ~
git clone <your-repo-url> app
cd app
```

Our `profiles` table has a foreign key to `auth.users`, which the Auth
(GoTrue) service creates on its *own* first boot — not the Postgres image
itself. Confirm that's finished before applying our migrations:

```bash
docker compose -f ~/supabase/docker/docker-compose.yml exec -T db \
  psql -U postgres -d postgres -c "\d auth.users"
# should print a column list. "relation does not exist" → wait ~30s, retry.
```

Apply migrations, in order, then the seed data:

```bash
for f in supabase/migrations/*.sql; do
  echo "Applying $f"
  docker compose -f ~/supabase/docker/docker-compose.yml exec -T db \
    psql -U postgres -d postgres < "$f"
done

docker compose -f ~/supabase/docker/docker-compose.yml exec -T db \
  psql -U postgres -d postgres < supabase/seed.sql
```

Verify:

```bash
docker compose -f ~/supabase/docker/docker-compose.yml exec -T db \
  psql -U postgres -d postgres -c "select count(*) from public.branches;"
# should return 13
```

---

## Phase 5 — Resend (email reminders)

1. Sign up at resend.com.
2. **Domains → Add Domain** → `yourdomain.com` (or a subdomain like
   `mail.yourdomain.com` if you'd rather keep it separate).
3. Add the DNS records Resend gives you (SPF `TXT`, DKIM `TXT`/`CNAME`,
   optionally `DMARC`) at your DNS provider, then click **Verify**.
4. **API Keys → Create API Key** — this is `RESEND_API_KEY`.
5. Pick a sending address on the verified domain, e.g.
   `reminders@yourdomain.com` — this is `REMINDERS_FROM_EMAIL`.

---

## Phase 6 — Configure this app's secrets

```bash
cd ~/app
cp .env.local.example .env.local
```

Edit `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://api.yourdomain.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY from Phase 3.1>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY from Phase 3.1>

RESEND_API_KEY=<from Phase 5>
REMINDERS_FROM_EMAIL=reminders@yourdomain.com

CRON_SECRET=<generate with: openssl rand -hex 32>
```

---

## Phase 7 — Nginx + Certbot (additive — doesn't touch `bestway-video`)

Install Certbot's Nginx plugin:

```bash
apt update
apt install -y certbot python3-certbot-nginx
```

Create **new** site files — these don't touch the existing
`bestway-video` config at all:

`/etc/nginx/sites-available/app.yourdomain.com`:
```nginx
server {
    listen 80;
    server_name app.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

`/etc/nginx/sites-available/api.yourdomain.com`:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

(`3001` matches this repo's `docker-compose.yml`. `8000` is Kong's port
from Phase 3.3 — adjust if yours differs.)

Enable them:

```bash
ln -s /etc/nginx/sites-available/app.yourdomain.com /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/api.yourdomain.com /etc/nginx/sites-enabled/

# Always test before reloading on a box serving live traffic.
# A bad config makes `reload` refuse to apply it — bestway-video keeps
# running on the old config either way — but always check first.
nginx -t
systemctl reload nginx   # never `restart` here — reload is the safe one
```

Get certificates for **only** the two new domains — passing explicit `-d`
flags means Certbot won't touch `bestway-video`'s certificate or config:

```bash
certbot --nginx -d app.yourdomain.com -d api.yourdomain.com
```

Certbot edits just those two site files to add the `listen 443 ssl;`
block and an HTTP→HTTPS redirect, and sets up automatic renewal via a
systemd timer (`systemctl list-timers | grep certbot` to confirm) — no
further action needed.

---

## Phase 8 — Bring up the app

`NEXT_PUBLIC_*` variables get baked into the browser-side bundle at
**build time**, not read at container runtime — so they have to be passed
as Docker build args, sourced from `.env.local`. Compose only
auto-loads a file literally named `.env` for that `${...}` substitution,
not `.env.local`, so **always pass `--env-file .env.local` explicitly**
when building or you'll get a working server but a broken login page
(confirmed this exact failure mode while testing this guide — the error
looks like `Uncaught Error: @supabase/ssr: Your project's URL and API key
are required...` in the browser console):

```bash
cd ~/app
docker compose --env-file .env.local up -d --build
docker compose ps
docker compose logs -f app
```

Visit `https://app.yourdomain.com/login`.

---

## Phase 9 — Create the first admin user

There's no public sign-up — accounts are created by an admin, and there's
no admin yet. Bootstrap the first one by calling Supabase Auth's admin API
directly:

```bash
SERVICE_ROLE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY ~/app/.env.local | cut -d= -f2)

curl -s -X POST "https://api.yourdomain.com/auth/v1/admin/users" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "YOUR_REAL_EMAIL@yourdomain.com",
    "password": "choose-a-strong-temporary-password",
    "email_confirm": true,
    "user_metadata": { "full_name": "Your Name", "role": "legal_admin", "branch_id": null }
  }'
```

Edit the email/password first. A successful response is a JSON blob
describing the new user. If you get a JWT/role error instead, confirm
`SERVICE_ROLE_KEY` matches between `~/supabase/docker/.env` and
`~/app/.env.local`.

> Tested this exact request shape against a local instance before writing
> it here — confirmed it creates the `auth.users` row *and* correctly
> populates `public.profiles` via the `handle_new_user` trigger.

Log in at `https://app.yourdomain.com/login`. From there, use **Settings →
Users & roles** to create every other admin and branch manager — the
temp-password flow shows the password once on creation.

---

## Phase 10 — End-to-end smoke test

1. Log in as the admin you just created.
2. **Settings** → add a branch, add a document type, create a branch
   manager user (note the temp password shown).
3. Log out, log in as that branch manager.
4. Upload a document, set dates, save — confirm the status badge is right.
5. Toggle the language switcher — confirm Arabic + RTL render correctly.
6. As admin, confirm the compliance matrix shows what you just uploaded.
7. Trigger the cron route manually:
   ```bash
   curl -i -H "Authorization: Bearer $(grep CRON_SECRET ~/app/.env.local | cut -d= -f2)" \
     https://app.yourdomain.com/api/cron/reminders
   ```
   Should return `200` with `itemsFound`/`emailsSent`/`itemsLogged`, not `500`.
8. Confirm `bestway-video` still works exactly as before — nothing above
   should have touched it, but verify anyway.

---

## Phase 11 — Ongoing operations

**Deploying updates:**
```bash
cd ~/app
git pull
docker compose --env-file .env.local up -d --build
```

**Logs:**
```bash
docker compose logs -f app    # app
docker compose logs -f cron   # should show one curl per day at 06:00
```

**After a reboot:** Docker's `restart: unless-stopped` plus Docker
starting on boot by default after the install script means the app + cron
containers come back automatically. Nginx and Certbot's renewal timer are
both systemd services, already enabled. Nothing manual needed.

**Watch memory now that this is running alongside coturn + the WebRTC
app:**
```bash
free -h
docker stats --no-stream
```
If things get tight, the Studio/meta pair is the first thing to confirm
is actually stopped (Phase 3.2) — it's easy to forget running after a
debugging session.

**Backups — the part that matters most for a compliance app:**
Self-hosting Supabase means *you* own backups now; there's no managed
PITR. At minimum, a nightly pg_dump:

```bash
mkdir -p ~/backups
```

```bash
# /etc/cron.daily/backup-db (chmod +x)
#!/bin/sh
docker compose -f /root/supabase/docker/docker-compose.yml exec -T db \
  pg_dump -U postgres postgres | gzip > /root/backups/db-$(date +%F).sql.gz
find /root/backups -name "db-*.sql.gz" -mtime +30 -delete
```

Copy `~/backups` off the box regularly (rsync to another machine, or sync
to S3/Backblaze) — a backup that only lives on the same disk as the
database doesn't protect you if the VPS is lost. Also back up the storage
service's volume (check `~/supabase/docker/docker-compose.yml` for its
mount) the same way — uploaded documents live there, not in Postgres.

**Monitoring:** nothing is set up yet. At minimum, a free uptime check
(e.g. UptimeRobot hitting `https://app.yourdomain.com/login`) tells you if
the app goes down before a user reports it.
