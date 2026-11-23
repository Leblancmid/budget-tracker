# Knowing when the server PC is down

Auto-posts, backups and morning alerts all run on the server PC. If it crashes, loses power or its
scheduler stops, nothing on that PC can tell you. So the scheduler sends a "still alive" ping every
5 minutes to a free monitoring service, and **the service** messages you when the pings stop.

The ping carries no data: it's an empty request to a private link.

## Setup with Healthchecks.io (free, no card)

1. Sign up at **healthchecks.io** (the free plan is enough).
2. Your project → **Add Check**:
   - **Name:** `Budget server`
   - **Schedule → Simple:** Period **5 minutes**, Grace time **10 minutes**
     (a ping can be a few minutes late when the PC is busy; 15 minutes of silence means trouble).
3. **Integrations** (left menu) → **Discord** → **Add Integration**, and pick the Discord server and
   channel where you want the alert (a private one, e.g. your own #alerts). Email works too.
   Make sure the check has that integration ticked.
4. Open the check and copy its **ping URL** (`https://hc-ping.com/…`). Treat it like a password.
5. On the server, in `backend\.env`:
   ```
   HEARTBEAT_URL=https://hc-ping.com/your-uuid
   ```
6. Run `deploy.ps1` (or the after-deploy script) so the setting is picked up, then test once:
   `php artisan heartbeat:ping` → **Pinged the monitoring service.** The check turns green within a
   minute.

From then on you get a Discord message when the server has been silent for 15 minutes, and another
when it's back.

**Quick test:** stop the "Budget Scheduler" task in Windows Task Scheduler for 20 minutes; you should
get the "down" message, then "up" after you start it again.
