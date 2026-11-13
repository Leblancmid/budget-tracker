<?php

namespace App\Services;

use App\Models\PushSubscription;
use App\Models\User;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;
use Throwable;

/**
 * Phone alerts (web push) to the devices a user turned them on for. Off (silently) until the server
 * has its keys; a device the push service says is gone is forgotten. Never throws: an alert that
 * can't be sent must not break what triggered it (the bell still has it).
 */
class PhoneAlerts
{
    /** Overridable in tests */
    public static ?\Closure $sender = null;

    public static function configured(): bool
    {
        return (bool) config('services.webpush.public_key') && (bool) config('services.webpush.private_key');
    }

    /** @return int devices it was sent to */
    public static function send(User $user, string $title, string $body, string $url = '/'): int
    {
        if (! self::configured()) {
            return 0;
        }
        $devices = PushSubscription::where('user_id', $user->id)->get();
        if ($devices->isEmpty()) {
            return 0;
        }

        // Short on purpose: it shows on the lock screen
        $payload = json_encode(['title' => mb_strimwidth($title, 0, 80, '…'), 'body' => mb_strimwidth($body, 0, 180, '…'), 'url' => $url]);

        try {
            return (self::$sender ?? self::deliver(...))($devices, $payload);
        } catch (Throwable $e) {
            Log::warning('Phone alert not sent: ' . $e->getMessage());

            return 0;
        }
    }

    /** @param \Illuminate\Support\Collection<int, PushSubscription> $devices */
    private static function deliver($devices, string $payload): int
    {
        $push = new WebPush(['VAPID' => [
            'subject'    => config('services.webpush.subject'),
            'publicKey'  => config('services.webpush.public_key'),
            'privateKey' => config('services.webpush.private_key'),
        ]], ['TTL' => 3600, 'urgency' => 'high'], new Client(['timeout' => 10]));

        $byEndpoint = $devices->keyBy('endpoint');
        foreach ($devices as $d) {
            $push->queueNotification(Subscription::create([
                'endpoint' => $d->endpoint,
                'publicKey' => $d->public_key,
                'authToken' => $d->auth_token,
                'contentEncoding' => 'aes128gcm',
            ]), $payload);
        }

        $sent = 0;
        foreach ($push->flush() as $report) {
            $device = $byEndpoint->get($report->getEndpoint());
            if ($report->isSuccess()) {
                $sent++;
                $device?->forceFill(['last_sent_at' => now()])->save();
            } elseif ($report->isSubscriptionExpired()) {
                $device?->delete();
            } else {
                Log::warning('Phone alert refused: ' . $report->getReason());
            }
        }

        return $sent;
    }
}
