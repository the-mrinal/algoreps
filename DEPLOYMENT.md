# DSA Dashboard — Deployment Guide

Deployment instructions for a DigitalOcean Droplet (Ubuntu 22.04+).

## Prerequisites

| Software | Version | Install |
|----------|---------|---------|
| Node.js | 18+ | `curl -fsSL https://deb.nodesource.com/setup_18.x \| sudo -E bash - && sudo apt install -y nodejs` |
| PM2 | latest | `sudo npm install -g pm2` |
| Nginx | latest | `sudo apt install -y nginx` |
| Certbot | latest | `sudo apt install -y certbot python3-certbot-nginx` |
| Git | latest | `sudo apt install -y git` |

## Initial Setup

### 1. Clone the Repository

```bash
cd /opt
git clone <your-repo-url> dsa-dashboard
cd dsa-dashboard
```

### 2. Configure Environment Variables

```bash
cp .env.local.example .env.local
nano .env.local
```

Fill in all values:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (e.g., `https://abc.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for cron jobs) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `DISCORD_WEBHOOK_URL` | Discord channel webhook URL |
| `CRON_SECRET` | Random secret for cron endpoint auth (e.g., `openssl rand -hex 32`) |

### 3. Apply Database Schema

Open the Supabase SQL Editor and run the contents of `supabase/schema.sql`.

### 4. Deploy the Application

```bash
bash scripts/deploy.sh
```

This will:
- Install dependencies (`npm ci`)
- Build the Next.js app (`npm run build`)
- Start the app with PM2
- Check Nginx configuration

### 5. Configure Nginx

```bash
sudo cp scripts/nginx-dsa-dashboard.conf /etc/nginx/sites-available/dsa-dashboard
sudo ln -s /etc/nginx/sites-available/dsa-dashboard /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

Edit the server name:

```bash
sudo nano /etc/nginx/sites-available/dsa-dashboard
# Replace dsa.example.com with your actual domain
```

Test and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Set Up HTTPS with Let's Encrypt

```bash
sudo certbot --nginx -d dsa.example.com
```

Certbot will automatically:
- Obtain an SSL certificate
- Configure Nginx for HTTPS
- Set up auto-renewal

After certbot completes, uncomment the HTTPS server block and HTTP redirect in the Nginx config if certbot didn't do it automatically.

Verify auto-renewal:

```bash
sudo certbot renew --dry-run
```

### 7. Set Up Cron Jobs

```bash
sudo touch /var/log/dsa-cron.log
sudo chown $(whoami) /var/log/dsa-cron.log
bash scripts/cron-setup.sh https://dsa.example.com your-cron-secret
```

This installs two cron entries:
- **Morning briefing**: 8:00 AM IST (02:30 UTC) — sends Discord notification with due revisions
- **Evening wrap-up**: 9:00 PM IST (15:30 UTC) — sends Discord summary of daily progress

The `CRON_SECRET` passed here must match the value in `.env.local`.

Verify:

```bash
crontab -l
```

### 8. Enable PM2 Startup

```bash
pm2 startup
# Run the command PM2 outputs
pm2 save
```

This ensures the app restarts on server reboot.

## Updating / Redeploying

```bash
cd /opt/dsa-dashboard
git pull origin main
bash scripts/deploy.sh
```

The deploy script handles building and restarting the PM2 process.

## Useful Commands

```bash
# Application
pm2 status                    # Check process status
pm2 logs dsa-dashboard        # View live logs
pm2 restart dsa-dashboard     # Restart app
pm2 monit                     # Resource monitoring

# Nginx
sudo nginx -t                 # Test config
sudo systemctl reload nginx   # Reload config
sudo tail -f /var/log/nginx/error.log  # View Nginx errors

# Cron
crontab -l                    # List cron jobs
tail -f /var/log/dsa-cron.log # View cron log
```

## Troubleshooting

**App not starting?**
- Check `.env.local` exists and has all required values
- Check PM2 logs: `pm2 logs dsa-dashboard --lines 50`

**502 Bad Gateway?**
- Verify PM2 is running: `pm2 status`
- Check the app is listening on port 3000: `curl http://localhost:3000`

**Cron not firing?**
- Verify crontab entries: `crontab -l`
- Check cron log: `tail /var/log/dsa-cron.log`
- Test manually: `curl -H "Authorization: your-cron-secret" https://dsa.example.com/api/cron/morning`

**SSL certificate issues?**
- Renew manually: `sudo certbot renew`
- Check certificate status: `sudo certbot certificates`
