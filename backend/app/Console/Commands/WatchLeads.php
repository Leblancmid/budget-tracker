<?php

namespace App\Console\Commands;

use App\Notifications\AppAlert;
use App\Services\Alerts;
use App\Services\WebsiteStats;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * Every minute: looks for new website leads and tells everyone with the Storefront (bell + phone).
 * Remembers the newest lead it has seen; the very first run only takes note (no flood of old leads).
 */
class WatchLeads extends Command
{
    protected $signature = 'leads:watch';

    protected $description = 'Alert storefront users about new website leads';

    public const SEEN_KEY = 'leads:last_seen_id';

    /** More new leads than this at once become one summary alert */
    private const MAX_EACH = 3;

    public function handle(): int
    {
        if (! WebsiteStats::configured()) {
            return self::SUCCESS;
        }
        try {
            $leads = collect(WebsiteStats::rawLeads());
        } catch (Throwable $e) {
            // The website or the connection is down: try again next minute
            $this->warn('Leads not checked: ' . $e->getMessage());

            return self::SUCCESS;
        }

        $newest = (int) $leads->max('id');
        $seen = Cache::get(self::SEEN_KEY);
        if ($seen === null) {
            Cache::forever(self::SEEN_KEY, $newest);

            return self::SUCCESS;
        }

        $fresh = $leads->filter(fn ($l) => (int) $l['id'] > (int) $seen)->sortBy('id')->values();
        if ($fresh->isEmpty()) {
            return self::SUCCESS;
        }
        Cache::forever(self::SEEN_KEY, max($newest, (int) $seen));

        if ($fresh->count() > self::MAX_EACH) {
            $alert = new AppAlert('lead', "{$fresh->count()} new leads", 'From the website. Open Leads to answer them.', '/business/leads', key: 'leads-to-' . $newest);
            Alerts::toEveryoneWith('storefront', $alert);
        } else {
            foreach ($fresh as $lead) {
                Alerts::toEveryoneWith('storefront', new AppAlert('lead', self::title($lead), self::summary($lead), '/business/leads', key: 'lead-' . $lead['id']));
            }
        }
        $this->info("{$fresh->count()} new lead(s).");

        return self::SUCCESS;
    }

    /** "New lead: wants an account" (never the buyer's name or contact: it shows on the lock screen) */
    public static function title(array $lead): string
    {
        return match ($lead['type'] ?? null) {
            'gold'  => 'New gold order',
            'sell'  => 'Someone is selling an account',
            default => 'New lead: wants an account',
        };
    }

    public static function summary(array $lead): string
    {
        $d = is_array($lead['details'] ?? null) ? $lead['details'] : [];

        return match ($lead['type'] ?? null) {
            'gold'  => trim(($d['amount_kk'] ?? '?') . ' KK' . (! empty($d['payment']) ? ' · ' . $d['payment'] : '')),
            'sell'  => trim('Lv ' . ($d['level'] ?? '?') . ' ' . ($d['category'] ?? '') . (! empty($d['asking']) ? ' · asking ' . $d['asking'] : '')),
            default => $d['title'] ?? 'An account for sale',
        };
    }
}
