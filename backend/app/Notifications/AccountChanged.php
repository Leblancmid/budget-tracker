<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

/**
 * Tells someone an admin changed their account (access, details, password, turned back on).
 * In-app only (the bell); stored in the notifications table.
 */
class AccountChanged extends Notification
{
    /** @param string $kind access | details | password | reactivated */
    public function __construct(
        private readonly string $kind,
        private readonly string $title,
        private readonly string $body,
        private readonly string $by,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return ['kind' => $this->kind, 'title' => $this->title, 'body' => $this->body, 'by' => $this->by];
    }
}
