<?php

return [
    /*
    | The Leblanc website repo (Vite/React on Vercel). "Publish listings" writes the accounts
    | for sale into it (src/data/listings.json + public/listings/), commits and pushes, and
    | Vercel redeploys. Leave empty to turn publishing off.
    */
    'site_path' => env('LISTING_SITE_PATH'),

    // Push after committing (false = commit only, push yourself)
    'push' => (bool) env('LISTING_SITE_PUSH', true),

    // How many of the highest-level accounts are "featured" on the home page
    'featured' => 3,
];
