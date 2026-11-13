<?php

namespace App\Notifications;

/** Tells someone an admin changed their account (access, details, password, turned back on). */
class AccountChanged extends AppAlert
{
    /** @param string $kind access | details | password | reactivated */
    public function __construct(string $kind, string $title, string $body, string $by)
    {
        parent::__construct($kind, $title, $body, '/profile', $by);
    }
}
