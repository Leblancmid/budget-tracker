<?php

return [
    /*
    | The Leblanc website repo (Vite/React, hosted on Cloudflare Pages). "Publish listings"
    | writes the accounts for sale into it (src/data/listings.json + public/listings/), commits
    | and pushes, and the site redeploys. Leave empty to turn publishing off.
    */
    'site_path' => env('LISTING_SITE_PATH'),

    // Push after committing (false = commit only, push yourself)
    'push' => (bool) env('LISTING_SITE_PUSH', true),

    // How many of the highest-level accounts are "featured" on the home page
    'featured' => 3,

    /*
    | The live website and the secret it shares with this app (STATS_TOKEN in Cloudflare).
    | Used to read visitor stats and to send "Notify me" matches after each publish.
    */
    'site_url'   => rtrim((string) env('LISTING_SITE_URL', 'https://leblancmid.pages.dev'), '/'),
    'site_token' => env('LISTING_SITE_TOKEN'),
];
