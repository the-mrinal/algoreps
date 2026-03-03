# Deployment Guide

This guide covers deploying AlgoReps to a **DigitalOcean droplet** with Nginx, PM2, and Let's Encrypt SSL.

---

## Architecture

```
Internet
   │
   ▼
Nginx (:80 / :443)        ← SSL termination, static asset caching
   │
   ▼
Next.js (:3000, via PM2)  ← App server with autorestart
   │
   ├──▶ Supabase           (PostgreSQL + Auth + RLS)
   ├──▶ Gemini API          (AI code review, optional)
   └──▶ Discord Webhooks    (notifications, optional)

System cron
   │
   └──▶ GET /api/cron/morning   (8:00 AM IST)
   └──▶ GET /api/cron/evening   (9:00 PM IST)
```

---

## Prerequisites

Install the following on your DigitalOcean droplet:

| Dependency | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| npm | (bundled) | Package manager |
| Python 3 | 3.x | Code execution (user submissions) |
| Go | 1.x | Code execution (user submissions) |
| PM2 | latest | Process manager |
| Nginx | latest | Reverse proxy |
| Certbot | latest | SSL certificates (optional) |

```bash
# Example setup on Ubuntu 22.04
sudo apt update && sudo apt upgrade -y

# Node.js 18+ (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Python 3 and Go
sudo apt install -y python3 golang-go

# PM2
sudo npm install -g pm2

# Nginx
sudo apt install -y nginx

# Certbot (for SSL)
sudo apt install -y certbot python3-certbot-nginx
```

---

## Step 1: Clone and Configure

```bash
git clone https://github.com/the-mrinal/algoreps.git
cd algoreps
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional — AI code review
GEMINI_API_KEY=your-gemini-api-key

# Optional — Discord notifications
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
CRON_SECRET=your-random-secret
```

---

## Step 2: Set Up the Database

Run `supabase/schema.sql` in the [Supabase SQL Editor](https://supabase.com/dashboard). This creates:

- **`profiles`** — Auto-created on signup via database trigger
- **`problems`** — Problem bank with full metadata
- **`user_progress`** — Submissions, SRS state, AI reviews
- Row-Level Security policies for all tables

Then seed the problem bank:

```bash
npx tsx scripts/seed-problems.ts
```

---

## Step 3: Deploy the Application

Run the deploy script:

```bash
bash scripts/deploy.sh
```

This script performs four steps:

1. **Validates prerequisites** — Checks for Node.js 18+, npm, and PM2
2. **Installs dependencies** — `npm ci --production=false`
3. **Builds Next.js** — `npm run build`
4. **Starts/restarts PM2** — Uses `ecosystem.config.js` to manage the process

### What `ecosystem.config.js` configures

| Setting | Value |
|---------|-------|
| Process name | `dsa-dashboard` |
| Port | 3000 |
| Instances | 1 |
| Autorestart | Enabled |
| Max memory | 512 MB |
| Environment | `NODE_ENV=production` |

---

## Step 4: Configure Nginx

Copy the provided Nginx config:

```bash
sudo cp scripts/nginx-dsa-dashboard.conf /etc/nginx/sites-available/algoreps
sudo ln -s /etc/nginx/sites-available/algoreps /etc/nginx/sites-enabled/
```

Edit the file to replace `dsa.example.com` with your actual domain:

```bash
sudo nano /etc/nginx/sites-available/algoreps
```

Test and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### What the Nginx config does

- Proxies all requests to `http://127.0.0.1:3000` (the Next.js app)
- Sets WebSocket headers (`Upgrade`, `Connection`) for real-time features
- Forwards real client IP via `X-Real-IP` and `X-Forwarded-For`
- Caches static assets (`/_next/static`) for 1 hour with immutable `Cache-Control`

---

## Step 5: Set Up SSL (Optional but Recommended)

```bash
sudo certbot --nginx -d dsa.example.com
```

After Certbot completes, uncomment the HTTPS server block in the Nginx config and reload:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## Step 6: Set Up Cron Jobs (Optional)

If you have Discord notifications configured, install the cron jobs for morning and evening briefings:

```bash
bash scripts/cron-setup.sh https://dsa.example.com your-cron-secret
```

This installs two crontab entries:

| Job | Schedule (UTC) | Schedule (IST) | Endpoint |
|-----|---------------|-----------------|----------|
| Morning briefing | 02:30 daily | 8:00 AM daily | `GET /api/cron/morning` |
| Evening wrap-up | 15:30 daily | 9:00 PM daily | `GET /api/cron/evening` |

Cron logs are written to `/var/log/dsa-cron.log`.

Verify with:

```bash
crontab -l
```

---

## Useful PM2 Commands

```bash
pm2 status                  # Check process status
pm2 logs dsa-dashboard      # View application logs
pm2 restart dsa-dashboard   # Restart the application
pm2 stop dsa-dashboard      # Stop the application
pm2 delete dsa-dashboard    # Remove from PM2
pm2 monit                   # Real-time monitoring dashboard
```

---

## Redeploying

After pulling new changes, re-run the deploy script:

```bash
cd /path/to/algoreps
git pull origin master
bash scripts/deploy.sh
```

The script handles dependency installation, building, and PM2 restart automatically.

---

## Troubleshooting

### Application won't start
- Check `.env.local` exists and has all required variables
- Verify Node.js version: `node -v` (must be 18+)
- Check PM2 logs: `pm2 logs dsa-dashboard --lines 50`

### 502 Bad Gateway from Nginx
- Verify the app is running: `pm2 status`
- Check the app is listening on port 3000: `curl http://127.0.0.1:3000`
- Review Nginx error log: `sudo tail -f /var/log/nginx/error.log`

### Cron jobs not firing
- Verify crontab entries: `crontab -l`
- Check the cron log: `tail -f /var/log/dsa-cron.log`
- Test manually: `curl -H "Authorization: your-cron-secret" https://dsa.example.com/api/cron/morning`

### Code execution not working
- Verify Python 3 is installed: `python3 --version`
- Verify Go is installed: `go version`
- Code runs in `/tmp` — ensure the directory is writable
