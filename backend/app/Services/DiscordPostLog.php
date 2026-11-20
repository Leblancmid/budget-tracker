<?php

namespace App\Services;

use App\Models\DiscordPost;
use Carbon\CarbonImmutable;

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

    /** @param list<array{key: string, no: int, ok: bool, status: ?int, note: ?string}> $channels */
    public static function record(string $kind, array $channels): void
    {
        [$date, $slot] = self::slotNow();
        foreach ($channels as $c) {
            DiscordPost::create([
                'kind' => $kind, 'slot_date' => $date, 'slot' => $slot,
                'channel_key' => $c['key'], 'channel_no' => $c['no'], 'ok' => $c['ok'], 'status' => $c['status'], 'note' => $c['note'],
            ]);
        }
        DiscordPost::where('created_at', '<', now()->subDays(self::KEEP_DAYS))->delete();
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
        $channels = array_map(fn (array $c) => [...$c, 'last_sent_at' => isset($lastSent[$c['key']])
            ? CarbonImmutable::parse($lastSent[$c['key']])->toIso8601String() : null,
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
        $own = DiscordPost::whereIn('kind', ['manual', 'publish'])->whereNotNull('channel_key')
            ->where('created_at', '>=', now()->subDays(self::DAYS))->orderByDesc('id')->limit(200)->get()
            ->groupBy(fn (DiscordPost $p) => $p->kind . '|' . $p->created_at->format('Y-m-d H:i'))
            ->take(10)
            ->map(fn ($rows) => [
                'kind' => $rows->first()->kind, 'at' => $rows->first()->created_at->toIso8601String(),
                'sent' => $rows->where('ok', true)->count(), 'total' => $rows->count(),
            ])->values()->all();

        return ['auto' => DiscordAutoPost::status(), 'channels' => $channels, 'days' => $days, 'own' => $own];
    }

    /** @return array{0: string, 1: string} the Manila day and am / pm */
    private static function slotNow(): array
    {
        $now = CarbonImmutable::now(BalanceInterest::ZONE);

        return [$now->toDateString(), $now->hour < self::EVENING_FROM ? 'am' : 'pm'];
    }
}
