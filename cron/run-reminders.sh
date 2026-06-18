#!/bin/sh
# Invoked daily by crond inside the cron sidecar container. Env vars aren't
# inherited by cron jobs by default, so the entrypoint dumps them to
# /app.env at container start and we source that here.
. /app.env

curl -fsS -H "Authorization: Bearer ${CRON_SECRET}" "${APP_URL:-http://app:3000}/api/cron/reminders"
echo
