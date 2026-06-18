#!/bin/sh
set -e

# Make CRON_SECRET/APP_URL available to the cron job, which otherwise runs
# with a near-empty environment.
env | grep -E '^(CRON_SECRET|APP_URL)=' > /app.env

touch /var/log/cron.log
crontab /etc/crontabs/root
crond -b -l 2

# Keep the container alive and surface cron output in `docker logs`.
tail -f /var/log/cron.log
