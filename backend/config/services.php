<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Where `php artisan screenshots:pull` downloads missing account screenshots from
    'screenshots' => [
        'source_url' => env('SCREENSHOT_SOURCE_URL'),
    ],

    // Phone alerts (web push). Make the keys with `php artisan push:keys`; empty = alerts off.
    // On Windows PHP also needs the OPENSSL_CONF environment variable (push:keys says how).
    'webpush' => [
        'public_key'  => env('VAPID_PUBLIC_KEY'),
        'private_key' => env('VAPID_PRIVATE_KEY'),
        // Who the push services can contact about these alerts (a URL of this app is enough)
        'subject'     => env('VAPID_SUBJECT', env('APP_URL', 'https://localhost')),
    ],

];
