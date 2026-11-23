<?php

namespace App\Services;

use App\Models\DiscordPost;
use Carbon\CarbonImmutable;
use RuntimeException;

/**
 * Which Discord channels each Listing Kit post reached, for the Discord page: the 10 AM and
 * 10 PM auto-posts per server and day, and the posts you made yourself.
 */
class DiscordPostLog
{
    /** Kept this long */
    public const KEEP_DAYS = 90;

    /** Days the grid shows */
    public const DAYS = 7;

    /** Before this hour (Manila) a post counts as the morning run, from it the evening run */
    private const EVENING_FROM = 16;

    /** @param list<array{key: string, no: int, ok: bool, status: ?int, note: ?string, message_id?: ?string}> $channels */
    public static function record(string $kind, array $channels): void
    {
        [$date, $slot] = self::slotNow();
        foreach ($channels as $c) {
            DiscordPost::create([
                'kind' => $kind, 'slot_date' => $date, 'slot' => $slot,
                'channel_key' => $c['key'], 'channel_no' => $c['no'], 'ok' => $c['ok'], 'status' => $c['status'], 'note' => $c['note'],
                'message_id' => $c['message_id'] ?? null,
            ]);
        }
        // Old rows go, except ones whose message is still up (the next post deletes it)
        DiscordPost::where('created_at', '<', now()->subDays(self::KEEP_DAYS))->whereNull('message_id')->delete();
    }

    /** An auto-post that didn't go out at all (what's for sale changed, no picture, ...) */
    public static function skipped(string $note): void
    {
        [$date, $slot] = self::slotNow();
        DiscordPost::create(['kind' => 'auto', 'slot_date' => $date, 'slot' => $slot, 'ok' => false, 'note' => $note]);
    }

    /**
     * The Discord page: the channels, a grid of the last 7 days' auto-posts (each day's 10 AM and
     * 10 PM, per channel), and your own recent posts.
     */
    public static function page(bool $fresh = false): array
    {
        $now   = CarbonImmutable::now(BalanceInterest::ZONE);
        $since = $now->subDays(self::DAYS - 1)->toDateString();
        $auto  = DiscordPost::where('kind', 'auto')->where('slot_date', '>=', $since)->orderBy('id')->get();

        $lastSent = DiscordPost::where('ok', true)->whereNotNull('channel_key')
            ->selectRaw('channel_key, max(created_at) as at')->groupBy('channel_key')->pluck('at', 'channel_key');
        $labels   = ListingAnnouncer::channelLabels();
        $reach    = self::reachBySource();
        $channels = array_map(fn (array $c) => [...$c,
            'label'        => $labels[$c['key']] ?? null, // your name for it, e.g. "Asian Market"
            ...ListingAnnouncer::channelSettings($c['key']), // schedule, replace
            'last_sent_at' => isset($lastSent[$c['key']]) ? CarbonImmutable::parse($lastSent[$c['key']])->toIso8601String() : null,
            // Who it brings to the website (null: website stats aren't connected)
            'reach'        => $reach === null ? null : ($reach[ListingAnnouncer::sourceTag($c['key'])] ?? ['visitors_7' => 0, 'visitors_30' => 0, 'requests_30' => 0]),
        ], ListingAnnouncer::channels($fresh));

        $days = [];
        for ($d = 0; $d < self::DAYS; $d++) {
            $date = $now->subDays($d)->toDateString();
            $day  = ['date' => $date];
            foreach (['am' => DiscordAutoPost::HOURS[0], 'pm' => DiscordAutoPost::HOURS[1]] as $slot => $hour) {
                $rows = $auto->filter(fn (DiscordPost $p) => $p->slot_date->toDateString() === $date && $p->slot === $slot);
                $day[$slot] = [
                    // The run's time has come (no rows then: auto-post was off, or the PC was)
                    'due'     => $now->greaterThanOrEqualTo(CarbonImmutable::parse($date, BalanceInterest::ZONE)->setTime($hour, 0)),
                    'skipped' => $rows->firstWhere('channel_key', null)?->note,
                    // Per channel: the last try in this run wins (e.g. run again by hand)
                    'results' => (object) $rows->whereNotNull('channel_key')->keyBy('channel_key')
                        ->map(fn (DiscordPost $p) => ['ok' => $p->ok, 'note' => $p->note, 'at' => $p->created_at->toIso8601String()])->all(),
                ];
            }
            $days[] = $day;
        }

        // Your own posts ("Post image to Discord", publish): one line per post
        // (a Send to one server is its own line, naming the server)
        $own = DiscordPost::whereIn('kind', ['manual', 'publish', 'single'])->whereNotNull('channel_key')
            ->where('created_at', '>=', now()->subDays(self::DAYS))->orderByDesc('id')->limit(200)->get()
            ->groupBy(fn (DiscordPost $p) => $p->kind === 'single' ? 'single|' . $p->id : $p->kind . '|' . $p->created_at->format('Y-m-d H:i'))
            ->take(15)
            ->map(fn ($rows) => [
                'kind' => $rows->first()->kind, 'at' => $rows->first()->created_at->toIso8601String(),
                'sent' => $rows->where('ok', true)->count(), 'total' => $rows->count(),
                'channel_key' => $rows->first()->kind === 'single' ? $rows->first()->channel_key : null,
            ])->values()->all();

        return ['auto' => DiscordAutoPost::status(), 'channels' => $channels, 'days' => $days, 'own' => $own];
    }

    /**
     * Visitors and requests per Discord server, from the website (its posts link there with
     * ?from=<tag>). Null when the website stats aren't connected or can't be reached.
     *
     * @return array<string, array{visitors_7: int, visitors_30: int, requests_30: int}>|null
     */
    public static function reachBySource(): ?array
    {
        if (! WebsiteStats::configured()) {
            return null;
        }
        try {
            $rows = WebsiteStats::fetch()['sources'] ?? [];
        } catch (RuntimeException) {
            return null;
        }

        return collect(is_array($rows) ? $rows : [])
            ->filter(fn ($r) => is_array($r) && is_string($r['source'] ?? null))
            ->mapWithKeys(fn (array $r) => [$r['source'] => [
                'visitors_7'  => (int) ($r['visitors_7'] ?? 0),
                'visitors_30' => (int) ($r['visitors_30'] ?? 0),
                'requests_30' => (int) ($r['requests_30'] ?? 0),
            ]])->all();
    }

    /** @return array{0: string, 1: string} the Manila day and am / pm */
    public static function slotNow(): array
    {
        $now = CarbonImmutable::now(BalanceInterest::ZONE);

        return [$now->toDateString(), $now->hour < self::EVENING_FROM ? 'am' : 'pm'];
    }
}
