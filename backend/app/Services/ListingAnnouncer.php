<?php

namespace App\Services;

use App\Models\DiscordPost;
use App\Models\SiteSetting;
use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Posts the Listing Kit image (all accounts for sale in one picture, drawn in the app) to your
 * Discord listings channels (LISTING_DISCORD_WEBHOOK), with buttons that send buyers to the
 * website. Publish posts it when what's for sale changed; "Post image to Discord" any time.
 */
class ListingAnnouncer
{
    /**
     * The channels to post to: LISTING_DISCORD_WEBHOOK holds one webhook link per server's
     * channel, separated by commas. Anything that isn't a https:// link is ignored.
     *
     * @return list<string>
     */
    public static function webhooks(): array
    {
        return collect(preg_split('/[\s,]+/', (string) config('listing.discord_webhook')) ?: [])
            ->filter(fn ($url) => str_starts_with($url, 'https://'))
            ->unique()
            ->values()
            ->all();
    }

    public static function configured(): bool
    {
        return self::webhooks() !== [];
    }

    /**
     * Did what's for sale change since the website was last published: an account added or
     * removed (sold), or a price changed? Other updates (stats, rates) don't count.
     */
    public static function listingsChanged(array $listings, array $published): bool
    {
        $key = fn (array $list) => collect($list)
            ->filter(fn ($l) => is_array($l) && isset($l['id']))
            ->mapWithKeys(fn ($l) => [$l['id'] => $l['price'] ?? null])
            ->sortKeys()
            ->all();

        return $key($listings) !== $key($published);
    }

    /**
     * A channel's tag on the website (?from=d-3fa9c2), so its visitors and requests count for that
     * server. Taken from the channel key: stable while the webhook link stays the same, and it
     * says nothing about the link itself.
     */
    public static function sourceTag(string $channelKey): string
    {
        return 'd-' . substr($channelKey, 0, 6);
    }

    /**
     * Your name for each channel's website tag ("d-3fa9c2" → "Asian Market", else "Channel 3"),
     * for the servers in LISTING_DISCORD_WEBHOOK now.
     *
     * @return array<string, string>
     */
    public static function sourceNames(): array
    {
        $labels = self::channelLabels();

        return collect(self::webhooks())->values()->mapWithKeys(function ($url, $i) use ($labels) {
            $key = self::channelKey($url);

            return [self::sourceTag($key) => $labels[$key] ?? 'Channel ' . ($i + 1)];
        })->all();
    }

    /** The accounts page, tagged with the channel the buyer came from (when one is given) */
    public static function forSaleUrl(?string $channelKey = null): string
    {
        $site = rtrim((string) config('listing.site_url'), '/');

        return "{$site}/for-sale" . ($channelKey ? '?from=' . self::sourceTag($channelKey) : '');
    }

    /**
     * Link buttons under the image: the accounts on the website (tagged with this channel), and
     * buying gold / selling to you straight on your Discord profile (to message you there).
     */
    public static function buttons(?string $channelKey = null): array
    {
        $site    = rtrim((string) config('listing.site_url'), '/');
        $profile = (string) config('listing.discord_profile');

        return [['type' => 1, 'components' => [
            ['type' => 2, 'style' => 5, 'label' => 'Browse accounts', 'emoji' => ['name' => '🛒'], 'url' => self::forSaleUrl($channelKey)],
            ['type' => 2, 'style' => 5, 'label' => 'Buy gold', 'emoji' => ['name' => '💰'], 'url' => $profile ?: "{$site}/gold-calculator"],
            ['type' => 2, 'style' => 5, 'label' => 'Sell to Leblanc', 'emoji' => ['name' => '🤝'], 'url' => $profile ?: "{$site}/for-sale#sell"],
        ]]];
    }

    /**
     * Post the image (PNG or JPEG bytes) to every channel: just the image, full size, with the
     * link buttons under it. If a channel won't take buttons (Discord only allows them on some
     * webhooks), it gets the image with a one-line link instead, so buyers can still reach the site.
     *
     * All channels are posted to at the same time, so ten servers take about as long as one.
     *
     * Each channel's result is kept for the Discord page ($kind: auto, manual, publish or single).
     * $only: just these channel keys (one server from the Discord page, or the ones an auto-post
     * run is scheduled for); null = every channel.
     *
     * @param  list<string>|null  $only
     * @return array{sent: int, total: int, failed: list<int>} how many channels it reached, of
     *                                                         how many, and the numbers of those it didn't
     */
    public static function postImage(string $contents, string $filename, string $kind = 'manual', ?array $only = null): array
    {
        // Keyed by position, so channel numbers stay the same when only some are posted to
        $hooks   = array_filter(self::webhooks(), fn ($url) => $only === null || in_array(self::channelKey($url), $only, true));
        // Each channel's own links (tagged ?from=, to see which server brings buyers)
        $buttons = fn (string $url) => ['components' => self::buttons(self::channelKey($url))];
        $plain   = fn (string $url) => ['content' => '🛒 ' . self::forSaleUrl(self::channelKey($url))];
        $request = fn ($http, string $url, array $payload) => $http->timeout(30)
            ->attach('files[0]', $contents, $filename)
            ->post($url, ['payload_json' => json_encode($payload)]);
        // $payload: the message for a channel, from its webhook link
        $all = fn (array $urls, callable $payload) => $urls === [] ? [] : Http::pool(fn (Pool $pool) => array_map(
            fn ($i) => $request($pool->as((string) $i), $urls[$i], $payload($hooks[$i])),
            array_keys($urls),
        ));

        // wait=true: Discord answers with the message, whose id lets the next post delete it
        $withButtons = array_map(fn ($url) => self::withQuery($url, 'with_components=true&wait=true'), $hooks);
        $results     = $all($withButtons, $buttons);
        // Channels that won't take buttons get the image with a link instead
        $noButtons = array_map(
            fn ($url) => self::withQuery($url, 'wait=true'),
            array_filter($hooks, fn ($i) => self::status($results[(string) $i] ?? null) === 400, ARRAY_FILTER_USE_KEY),
        );
        foreach ($all($noButtons, $plain) as $i => $res) {
            $results[$i] = $res;
        }

        $failed  = [];
        $channel = [];
        foreach ($hooks as $i => $url) {
            $res = $results[(string) $i] ?? null;
            $ok  = $res instanceof Response && $res->successful();
            $id  = $ok ? (string) $res->json('id') : '';
            $channel[] = ['key' => self::channelKey($url), 'no' => $i + 1, 'ok' => $ok, 'status' => self::status($res),
                'message_id' => ctype_digit($id) ? $id : null,
                'note' => $ok ? null : ($res instanceof Response ? self::problem($res->status()) : 'Couldn\'t reach Discord')];
            if ($ok) {
                continue;
            }
            $failed[] = $i + 1;
            // Logged as "channel 2", never the link itself (it's a secret)
            Log::warning('Discord listings post failed (channel ' . ($i + 1) . '): ' . ($res instanceof Response
                ? 'HTTP ' . $res->status() . ' ' . mb_substr($res->body(), 0, 300)
                : ($res instanceof Throwable ? $res->getMessage() : 'no answer')));
        }
        DiscordPostLog::record($kind, $channel);
        self::deleteEarlierPosts($hooks, $channel);

        return ['sent' => count($hooks) - count($failed), 'total' => count($hooks), 'failed' => $failed];
    }

    /**
     * One listing post per channel: where the new post went through, delete the ones before it
     * (Discord lets a webhook delete its own messages). A message already gone counts as deleted;
     * one that couldn't be deleted now is tried again after the next post.
     *
     * @param  array<int, string>  $hooks  the webhooks just posted to, by position
     * @param  list<array{key: string, ok: bool, message_id: ?string}>  $posted
     */
    private static function deleteEarlierPosts(array $hooks, array $posted): void
    {
        $byKey = collect($hooks)->mapWithKeys(fn ($url) => [self::channelKey($url) => $url]);
        // (not in channels set to keep every post)
        $fresh = collect($posted)->filter(fn ($p) => $p['ok'] && $p['message_id'] !== null && self::channelSettings($p['key'])['replace'])->keyBy('key');
        if ($fresh->isEmpty()) {
            return;
        }
        $old = DiscordPost::whereIn('channel_key', $fresh->keys())->whereNotNull('message_id')
            ->get(['id', 'channel_key', 'message_id'])
            ->reject(fn (DiscordPost $p) => $p->message_id === $fresh[$p->channel_key]['message_id'])
            ->values();
        if ($old->isEmpty()) {
            return;
        }

        $answers = Http::pool(fn (Pool $pool) => $old->map(fn (DiscordPost $p, $i) => $pool->as((string) $i)->timeout(15)
            ->delete(self::messageUrl($byKey[$p->channel_key], $p->message_id)))->all());
        $done = $old->filter(function (DiscordPost $p, $i) use ($answers) {
            $res = $answers[(string) $i] ?? null;

            return $res instanceof Response && ($res->successful() || $res->status() === 404);
        });
        if ($done->isNotEmpty()) {
            DiscordPost::whereIn('id', $done->pluck('id'))->update(['message_id' => null]);
        }
    }

    /** A webhook link with extra query parameters, e.g. ?wait=true */
    private static function withQuery(string $url, string $query): string
    {
        return $url . (str_contains($url, '?') ? '&' : '?') . $query;
    }

    /** The link to one of a webhook's messages (keeps a ?thread_id= the webhook link has) */
    private static function messageUrl(string $webhook, string $messageId): string
    {
        [$base, $query] = array_pad(explode('?', $webhook, 2), 2, null);

        return rtrim($base, '/') . '/messages/' . $messageId . ($query ? '?' . $query : '');
    }

    /** A short fingerprint of a webhook link: tells channels apart without keeping the secret */
    public static function channelKey(string $url): string
    {
        return substr(hash('sha256', $url), 0, 16);
    }

    /**
     * The channels as Discord knows them: the webhook's name (the name posts show, e.g. "Leblanc"),
     * a link that opens its channel in Discord, and whether the webhook still exists. Asked of
     * Discord at most once an hour. Your own names for them are kept apart (channelLabels).
     *
     * @return list<array{no: int, key: string, name: ?string, open_url: ?string, alive: ?bool}>
     */
    public static function channels(bool $fresh = false): array
    {
        $hooks = self::webhooks();
        if ($hooks === []) {
            return [];
        }
        $cacheKey = 'discord-channels-v2-' . self::channelKey(implode(',', $hooks));
        if ($fresh) {
            Cache::forget($cacheKey);
        }

        return Cache::remember($cacheKey, now()->addHour(), function () use ($hooks) {
            $answers = Http::pool(fn (Pool $pool) => array_map(
                fn ($i) => $pool->as((string) $i)->timeout(10)->get($hooks[$i]),
                array_keys($hooks),
            ));

            return array_map(function ($i) use ($hooks, $answers) {
                $res = $answers[(string) $i] ?? null;
                $ok  = $res instanceof Response && $res->successful();
                // Server and channel ids (not secret): a link that opens the channel in Discord
                $guild   = $ok ? (string) $res->json('guild_id') : '';
                $channel = $ok ? (string) $res->json('channel_id') : '';

                return [
                    'no'       => $i + 1,
                    'key'      => self::channelKey($hooks[$i]),
                    'name'     => $ok ? ($res->json('name') ?: null) : null,
                    'open_url' => ctype_digit($guild) && ctype_digit($channel) ? "https://discord.com/channels/{$guild}/{$channel}" : null,
                    // false: Discord says the webhook is gone; null: couldn't tell
                    'alive' => $res instanceof Response ? ($res->successful() ? true : ($res->status() === 404 ? false : null)) : null,
                ];
            }, array_keys($hooks));
        });
    }

    /** Your own names for the channels (e.g. "Asian Market"), by channel key */
    public const LABELS_KEY = 'discord_channel_names';

    /** @return array<string, string> */
    public static function channelLabels(): array
    {
        return (array) SiteSetting::read(self::LABELS_KEY, []);
    }

    /** Name a channel in the app (empty: back to the default name). */
    public static function setChannelLabel(string $key, ?string $label): void
    {
        $labels = self::channelLabels();
        $label  = trim((string) $label);
        if ($label === '') {
            unset($labels[$key]);
        } else {
            $labels[$key] = $label;
        }
        SiteSetting::write(self::LABELS_KEY, $labels);
    }

    /** Per-channel posting settings, by channel key */
    public const SETTINGS_KEY = 'discord_channel_settings';

    /**
     * When a channel gets auto-posts: both runs, the 10 AM or 10 PM one only, or never (you post
     * there yourself). For servers that allow one ad a day.
     */
    public const SCHEDULES = ['both', 'am', 'pm', 'manual'];

    /**
     * A channel's settings: schedule (see SCHEDULES) and replace (delete your previous post there
     * when posting a new one). Defaults: both runs, replace.
     *
     * @return array{schedule: string, replace: bool}
     */
    public static function channelSettings(string $key): array
    {
        $saved = ((array) SiteSetting::read(self::SETTINGS_KEY, []))[$key] ?? [];

        return [
            'schedule' => in_array($saved['schedule'] ?? null, self::SCHEDULES, true) ? $saved['schedule'] : 'both',
            'replace'  => (bool) ($saved['replace'] ?? true),
        ];
    }

    /** @param array{schedule?: string, replace?: bool} $changes */
    public static function setChannelSettings(string $key, array $changes): void
    {
        $all       = (array) SiteSetting::read(self::SETTINGS_KEY, []);
        $all[$key] = [...self::channelSettings($key), ...array_intersect_key($changes, ['schedule' => 1, 'replace' => 1])];
        SiteSetting::write(self::SETTINGS_KEY, $all);
    }

    /** The channels set to get the 10 AM ('am') or 10 PM ('pm') auto-post */
    public static function scheduledFor(string $slot): array
    {
        return collect(self::webhooks())->map(fn ($url) => self::channelKey($url))
            ->filter(fn ($key) => in_array(self::channelSettings($key)['schedule'], ['both', $slot], true))
            ->values()->all();
    }

    /** Is this key one of the channels in LISTING_DISCORD_WEBHOOK? */
    public static function hasChannel(string $key): bool
    {
        return collect(self::webhooks())->contains(fn ($url) => self::channelKey($url) === $key);
    }

    /** Discord's answer in plain words */
    private static function problem(int $status): string
    {
        return match (true) {
            $status === 404 => 'Webhook deleted',
            $status === 401 || $status === 403 => 'Not allowed',
            $status === 429 => 'Too many posts (rate limited)',
            $status === 413 => 'Image too large',
            $status >= 500  => 'Discord was down',
            default         => "Refused (HTTP {$status})",
        };
    }

    /** A pooled answer's HTTP status, or null when the request itself failed */
    private static function status(mixed $res): ?int
    {
        return $res instanceof Response ? $res->status() : null;
    }
}
