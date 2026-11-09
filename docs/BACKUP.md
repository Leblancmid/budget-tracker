# Off-site backups (Cloudflare R2)

Every day at 11:00 Manila the server copies its newest database export to Cloudflare R2,
compressed and encrypted with `BACKUP_PASSWORD`. R2 keeps the last `BACKUP_KEEP` copies (30 by default).
If it stops working for 2 days, the weekly brief (Business → Stats) says so.

## Setup (once)

1. Cloudflare → **Storage & databases → R2 Object Storage** → create a bucket named `budget-backups`.
   (R2 asks for a card even on the free plan; nothing is charged under 10 GB.)
2. R2 → **Manage API tokens** → **Create API token**: permission **Object Read & Write**, only the
   `budget-backups` bucket. Copy the **Access Key ID**, **Secret Access Key**, and your **Account ID**.
3. On the server, in `backend\.env`:
   ```
   BACKUP_R2_ACCOUNT_ID=...
   BACKUP_R2_ACCESS_KEY_ID=...
   BACKUP_R2_SECRET_ACCESS_KEY=...
   BACKUP_R2_BUCKET=budget-backups
   BACKUP_PASSWORD=a long passphrase only you know
   ```
   **Save `BACKUP_PASSWORD` somewhere off the server** (your phone's password manager). Without it the
   backups can't be opened, and it isn't stored anywhere else.
4. Run the after-deploy script (config is cached), then test it once:
   `php artisan db:export --keep=2` then `php artisan backup:offsite`.
   The file appears in the bucket as `budget/budget_tracker_<date>.sql.gz.enc`.

## Restoring

1. Download the backup you want from the R2 bucket (Cloudflare dashboard → the file → Download).
2. Decrypt it (asks for the password if `.env` doesn't have it):
   `php artisan backup:decrypt C:\path\budget_tracker_2026-11-09_02-00-00.sql.gz.enc`
   → writes `budget_tracker_2026-11-09_02-00-00.sql` next to it.
3. Try it on a scratch database first, never straight onto the live one:
   ```
   mysql -u root -e "CREATE DATABASE budget_restore_check"
   mysql -u root budget_restore_check < budget_tracker_2026-11-09_02-00-00.sql
   ```
   Check it looks right, then import into the real database the same way (or point `.env` at it).
