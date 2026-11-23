# Off-site backups (Google Drive, or Cloudflare R2)

Every day at 11:00 Manila the server copies its newest database export off the PC, compressed and
encrypted with `BACKUP_PASSWORD`: into a Google Drive folder (`BACKUP_FOLDER`), to Cloudflare R2, or
both. Each keeps the last `BACKUP_KEEP` copies (30 by default). Every Sunday at 11:30 it also copies
the uploaded files (account screenshots, profile pictures), which aren't in the database backup, to
the Drive folder (the last `BACKUP_KEEP_FILES`, 4 by default).
If a backup stops working, the weekly brief (Business → Stats) says so.

## Setup with Google Drive (free, no card)

The scheduler runs as Windows' **SYSTEM** account, so no one needs to be logged in. SYSTEM can't see
Google Drive's `G:` drive (that belongs to your Windows user), so Drive has to keep a real folder on
the disk instead:

1. On the server PC, open **Google Drive for desktop** → ⚙ **Settings** → **Google Drive** →
   choose **Mirror files** (not "Stream files"). Drive then keeps your files in a normal folder,
   usually `C:\Users\<you>\My Drive`. Wait until it says it's up to date.
2. In that folder, make a folder for the backups, e.g. `C:\Users\<you>\My Drive\Budget backups`.
3. On the server, in `backend\.env`:
   ```
   BACKUP_FOLDER='C:\Users\<you>\My Drive\Budget backups'
   BACKUP_PASSWORD=a long passphrase only you know
   ```
   Use **single quotes** around a Windows path: inside double quotes `.env` reads `\` as an escape,
   and the whole file stops loading ("Encountered an unexpected escape sequence").

   Or skip Mirror files: in Drive's setup (or Preferences → **My Computer** → **Add folder**) pick one
   plain folder such as `C:\backups` and tick **Sync with Google Drive**; then
   `BACKUP_FOLDER='C:\backups'`. Its copies show on drive.google.com under **Computers**.
   **Save `BACKUP_PASSWORD` somewhere off the server** (your phone's password manager). Without it the
   backups can't be opened, and it isn't stored anywhere else.
4. Run the after-deploy script (config is cached), then test it once:
   ```
   php artisan db:export --keep=2
   php artisan backup:offsite
   php artisan backup:files
   ```
   `Budget backups\database` gets `budget_tracker_<date>.sql.gz.enc` and `Budget backups\files` gets
   `budget_files_<date>.tar.gz.enc`. Check they show up on drive.google.com a minute later.

The files are encrypted before they reach Drive, so Google can't read them. Drive's free 15 GB holds
years of these (the database is well under 1 MB a day).

## Setup with Cloudflare R2 (optional, as well or instead)

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
4. Run the after-deploy script, then `php artisan db:export --keep=2` and `php artisan backup:offsite`.
   The file appears in the bucket as `budget/budget_tracker_<date>.sql.gz.enc`.

## Restoring

1. Get the backup you want: from the Drive folder (or drive.google.com → Download), or from the R2
   bucket (Cloudflare dashboard → the file → Download).
2. Decrypt it (asks for the password if `.env` doesn't have it):
   `php artisan backup:decrypt C:\path\budget_tracker_2026-11-09_02-00-00.sql.gz.enc`
   → writes `budget_tracker_2026-11-09_02-00-00.sql` next to it.
3. Try it on a scratch database first, never straight onto the live one:
   ```
   mysql -u root -e "CREATE DATABASE budget_restore_check"
   mysql -u root budget_restore_check < budget_tracker_2026-11-09_02-00-00.sql
   ```
   Check it looks right, then import into the real database the same way (or point `.env` at it).

**Uploaded files:** `php artisan backup:decrypt C:\path\budget_files_<date>.tar.gz.enc` gives a
`.tar`. Open it with Windows (or `tar -xf budget_files_<date>.tar`) and copy what's inside into
`backend\storage\app\public`.

## Monthly restore check

A backup only counts if it can be restored. On the 1st of every month (13:00 Manila) the server runs
`php artisan backup:verify`, which:

1. takes the newest backup from the Drive folder (or, without one, from R2) and decrypts it with
   `BACKUP_PASSWORD`;
2. loads it into a **scratch** database (`budget_restore_check`, or `BACKUP_VERIFY_DATABASE`) with the
   `mysql` client next to `mysqldump` (or `MYSQL_PATH`). It refuses to use the live database;
3. checks the main tables (users, daily entries, sales, accounts, gold, trades, wallets, logs) are all
   there with about as many rows as now, and that the newest backup is at most 3 days old;
4. drops the scratch database.

With nothing off-site it checks the newest export on this PC (`storage/app/backups`) instead, so you
still learn whether those restore; the weekly brief keeps reminding you to set up a backup folder.

If anything is wrong, admins get a "Backup check failed" alert (bell and phone) and the weekly brief
says so. The brief also reminds you if no check has run in 40 days. Run it by hand any time with
`php artisan backup:verify`: it prints each table's rows now and in the backup.
