<?php

return [
    /*
    | "Still alive" pings to a monitoring service (e.g. Healthchecks.io, free): the scheduler pings
    | this link every 5 minutes, and the service messages you (Discord, email) when the pings stop,
    | i.e. this PC is off, crashed, or its scheduler stopped. Empty = off. The link is a secret: it's
    | never logged. See docs/MONITORING.md.
    */
    'heartbeat_url' => env('HEARTBEAT_URL'),
];
