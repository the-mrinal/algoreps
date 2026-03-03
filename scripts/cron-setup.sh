#!/usr/bin/env bash
set -euo pipefail

# cron-setup.sh — Install crontab entries for DSA Dashboard cron jobs
#
# Morning briefing: 8:00 AM IST (02:30 UTC)
# Evening wrap-up:  9:00 PM IST (15:30 UTC)
#
# Usage: bash scripts/cron-setup.sh <APP_URL> <CRON_SECRET>
# Example: bash scripts/cron-setup.sh https://dsa.example.com my-secret-token

APP_URL="${1:?Usage: bash scripts/cron-setup.sh <APP_URL> <CRON_SECRET>}"
CRON_SECRET="${2:?Usage: bash scripts/cron-setup.sh <APP_URL> <CRON_SECRET>}"

# Remove trailing slash from APP_URL
APP_URL="${APP_URL%/}"

MORNING_CRON="30 2 * * * curl -s -o /dev/null -w '\%{http_code}' -H 'Authorization: ${CRON_SECRET}' ${APP_URL}/api/cron/morning >> /var/log/dsa-cron.log 2>&1"
EVENING_CRON="30 15 * * * curl -s -o /dev/null -w '\%{http_code}' -H 'Authorization: ${CRON_SECRET}' ${APP_URL}/api/cron/evening >> /var/log/dsa-cron.log 2>&1"

MARKER="# DSA Dashboard cron jobs"

# Check if cron jobs already exist
if crontab -l 2>/dev/null | grep -q "$MARKER"; then
  echo "DSA Dashboard cron jobs already exist. Removing old entries..."
  crontab -l 2>/dev/null | sed "/$MARKER/,/^$/d" | crontab -
fi

# Append new cron entries
(crontab -l 2>/dev/null; cat <<EOF

${MARKER}
${MORNING_CRON}
${EVENING_CRON}

EOF
) | crontab -

echo "Cron jobs installed:"
echo "  Morning briefing: 8:00 AM IST (02:30 UTC) daily"
echo "  Evening wrap-up:  9:00 PM IST (15:30 UTC) daily"
echo ""
echo "Log file: /var/log/dsa-cron.log"
echo ""
echo "Verify with: crontab -l"
