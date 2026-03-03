#!/usr/bin/env bash
set -euo pipefail

# deploy.sh — Build and deploy DSA Dashboard on a DigitalOcean Droplet
#
# Prerequisites: Node.js 18+, PM2, Nginx
# Usage: bash scripts/deploy.sh

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="dsa-dashboard"

echo "=== DSA Dashboard Deploy ==="
echo "Directory: ${APP_DIR}"
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Error: Node.js is not installed"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "Error: npm is not installed"; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo "Error: PM2 is not installed. Run: npm install -g pm2"; exit 1; }

# Check for .env.local
if [ ! -f "${APP_DIR}/.env.local" ]; then
  echo "Error: .env.local not found. Copy .env.local.example and fill in values."
  exit 1
fi

echo "[1/4] Installing dependencies..."
cd "${APP_DIR}"
npm ci --production=false

echo ""
echo "[2/4] Building Next.js application..."
npm run build

echo ""
echo "[3/4] Starting/restarting with PM2..."
if pm2 describe "${APP_NAME}" > /dev/null 2>&1; then
  pm2 restart "${APP_NAME}"
  echo "  Restarted existing PM2 process: ${APP_NAME}"
else
  pm2 start ecosystem.config.js
  echo "  Started new PM2 process: ${APP_NAME}"
fi

pm2 save

echo ""
echo "[4/4] Checking Nginx configuration..."
if command -v nginx >/dev/null 2>&1; then
  if nginx -t 2>/dev/null; then
    echo "  Nginx config OK"
    sudo systemctl reload nginx 2>/dev/null || sudo nginx -s reload 2>/dev/null || echo "  Note: Could not reload Nginx. Reload manually: sudo systemctl reload nginx"
  else
    echo "  Warning: Nginx config has errors. Fix before reloading."
  fi
else
  echo "  Nginx not found. Set up Nginx manually using scripts/nginx-dsa-dashboard.conf"
fi

echo ""
echo "=== Deploy Complete ==="
echo "App running on http://localhost:3000 (behind Nginx)"
echo ""
echo "Useful commands:"
echo "  pm2 status          — Check process status"
echo "  pm2 logs ${APP_NAME}  — View application logs"
echo "  pm2 restart ${APP_NAME} — Restart application"
