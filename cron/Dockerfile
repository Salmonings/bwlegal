# Minimal sidecar that triggers the daily reminders job on the app container.
# Self-hosted equivalent of Vercel Cron (this project no longer deploys to
# Vercel, so Vercel's cron config doesn't apply).
FROM alpine:3.20

RUN apk add --no-cache curl tzdata

COPY crontab /etc/crontabs/root
COPY run-reminders.sh /run-reminders.sh
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /run-reminders.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
