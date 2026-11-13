<?php

return [
    /*
    | Off-site backups to Cloudflare R2 (free up to 10 GB). Each database export is compressed
    | and encrypted with BACKUP_PASSWORD before upload, so Cloudflare can't read it.
    | Keep BACKUP_PASSWORD somewhere safe off this server (e.g. your phone's password manager):
    | without it the backups can't be opened.
    */
    'r2' => [
        'account_id' => env('BACKUP_R2_ACCOUNT_ID'),
        'key'        => env('BACKUP_R2_ACCESS_KEY_ID'),
        'secret'     => env('BACKUP_R2_SECRET_ACCESS_KEY'),
        'bucket'     => env('BACKUP_R2_BUCKET', 'budget-backups'),
    ],

    'password' => env('BACKUP_PASSWORD'),

    // How many backups to keep in R2 (one a day ≈ a month)
    'keep' => (int) env('BACKUP_KEEP', 30),

    // Folder (prefix) inside the bucket
    'prefix' => 'budget/',

    // The monthly restore check (backup:verify) loads the newest backup into this scratch database,
    // compares it with the live one, then drops it. It must never be the live database.
    'verify_database' => env('BACKUP_VERIFY_DATABASE', 'budget_restore_check'),
    // The mysql client used to load it (default: next to mysqldump)
    'mysql_path' => env('MYSQL_PATH'),
    // Where db:export writes (checked instead of R2 when off-site backup isn't set up)
    'local_path' => storage_path('app/backups'),
];
