<?php

namespace App\Services;

use App\Models\BusinessTransaction;
use Carbon\CarbonImmutable;

/**
 * How a month went, in one alert on the 1st: sold profit (and the goal), what sold, the Discord
 * server that brought the most buyers, and money that's been in stock over 2 months.
 */
class MonthRecap
{
    /**
     * The recap of the month before $today (null when nothing sold and nothing is in stock).
     *
     * @return array{title: string, body: string, month: string}|null
     */
    public static function forMonthBefore(CarbonImmutable $today): ?array
    {
        $month = $today->startOfMonth()->subMonth();
        // Same as the Business stats page: a sale counts in the month it was marked sold
        $sold = BusinessTransaction::archived()
            ->whereYear('archived_at', $month->year)->whereMonth('archived_at', $month->month)->get();
        $profit   = round(BusinessProfit::realized($sold)['profit'], 2);
        $accounts = $sold->where('type', 'account')->count();
        $golds    = $sold->where('type', 'gold')->whereNull('system_key')->count();
        $oldStock = collect(StockAging::build()['buckets'])->firstWhere('key', 'old')['cost_php'] ?? 0;

        if ($sold->isEmpty() && $oldStock <= 0) {
            return null;
        }

        $goal = ProfitGoal::progress($profit, $month->year, $month->month, $today);
        $goalText = match ($goal['status'] ?? null) {
            'reached' => ' (goal reached ✓)',
            'missed'  => ' (' . round($goal['percent']) . '% of your goal)',
            default   => '',
        };

        $parts = [];
        $parts[] = $accounts || $golds
            ? self::plural($accounts, 'account') . ' and ' . self::plural($golds, 'gold trade') . ' sold.'
            : 'Nothing sold.';
        if ($best = self::bestServer()) {
            $parts[] = "Best Discord server: {$best}.";
        }
        if ($oldStock > 0) {
            $parts[] = self::peso($oldStock) . ' has been in stock over 2 months: worth selling cheaper?';
        }

        return [
            'title' => $month->format('F') . ': ' . ($profit < 0 ? '−' : '') . self::peso(abs($profit)) . ' profit' . $goalText,
            'body'  => implode(' ', $parts),
            'month' => $month->format('Y-m'),
        ];
    }

    /** The server whose posts brought the most requests (then visitors) in the last 30 days */
    private static function bestServer(): ?string
    {
        $reach = DiscordPostLog::reachBySource();
        if (! $reach) {
            return null;
        }
        $names = ListingAnnouncer::sourceNames();
        $best  = collect($reach)->filter(fn ($r, $tag) => isset($names[$tag]) && $r['visitors_30'] > 0)
            ->sortBy([['requests_30', 'desc'], ['visitors_30', 'desc']])->keys()->first();

        return $best ? $names[$best] : null;
    }

    private static function plural(int $n, string $word): string
    {
        return $n . ' ' . $word . ($n === 1 ? '' : 's');
    }

    private static function peso(float $n): string
    {
        return '₱' . number_format($n, $n >= 1000 ? 0 : 2);
    }
}
