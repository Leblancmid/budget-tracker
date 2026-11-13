<?php

namespace App\Notifications\Channels;

use App\Models\User;
use App\Services\PhoneAlerts;
use Illuminate\Notifications\Notification;

/** Sends a notification's toPhone() (title, body, url) as a phone alert, if the user turned them on. */
class PhoneAlertChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        if (! $notifiable instanceof User || ! method_exists($notification, 'toPhone')) {
            return;
        }
        ['title' => $title, 'body' => $body, 'url' => $url] = $notification->toPhone($notifiable);
        PhoneAlerts::send($notifiable, $title, $body, $url);
    }
}
