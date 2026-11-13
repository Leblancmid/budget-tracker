<?php

namespace App\Notifications;

use App\Notifications\Channels\PhoneAlertChannel;
use Illuminate\Notifications\Notification;

/**
 * Something worth telling: shown on the bell, and sent as a phone alert to devices that have them
 * turned on. $url is where opening it takes you; $key (optional) marks it so the same alert isn't
 * sent twice (see Alerts::once).
 */
class AppAlert extends Notification
{
    public function __construct(
        public readonly string $kind,
        public readonly string $title,
        public readonly string $body,
        public readonly string $url = '/',
        public readonly ?string $by = null,
        public readonly ?string $key = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', PhoneAlertChannel::class];
    }

    public function toArray(object $notifiable): array
    {
        return array_filter([
            'kind'  => $this->kind,
            'title' => $this->title,
            'body'  => $this->body,
            'url'   => $this->url,
            'by'    => $this->by,
            'key'   => $this->key,
        ], fn ($v) => $v !== null);
    }

    /** @return array{title: string, body: string, url: string} */
    public function toPhone(object $notifiable): array
    {
        return ['title' => $this->title, 'body' => $this->body, 'url' => $this->url];
    }
}
