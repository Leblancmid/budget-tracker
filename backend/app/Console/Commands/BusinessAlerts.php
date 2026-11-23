<?php

namespace App\Console\Commands;

use App\Models\RucoyAccount;
use App\Models\Trade;
use App\Notifications\AppAlert;
use App\Services\Alerts;
use App\Services\BalanceInterest;
use App\Services\CreditCards;
use App\Services\ListingPerformance;
use App\Services\MonthRecap;
use App\Services\WebsiteStats;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Throwable;

/**
 * Every morning (Manila): tells people with Trading what's due (trades to complete, account
 * payments to collect) and, on Mondays, that the weekly brief is ready. Each alert once a day.
 * People with the Storefront also hear about buyers to follow up and listings slow to sell
 * (once for each new set, so the same ones don't nag every morning).
 */
class BusinessAlerts extends Command
{
    protected $signature = 'business:alerts {--date= : Act as if today were this Manila date (Y-m-d)}';

    protected $description = 'Morning alerts: trades and payments due, weekly brief ready';

    public function handle(): int
    {
        $today = $this->option('date')
            ? CarbonImmutable::parse($this->option('date'), BalanceInterest::ZONE)->startOfDay()
            : CarbonImmutable::now(BalanceInterest::ZONE)->startOfDay();
        $day = $today->format('Y-m-d');
        $sent = 0;

        // Trades whose completion date is today or has passed
        $trades = Trade::active()->whereNotNull('completion_date')->where('completion_date', '<=', $day)->get();
        if ($trades->isNotEmpty()) {
            $late = $trades->filter(fn ($t) => $t->completion_date->format('Y-m-d') < $day)->count();
            $dueToday = $trades->count() - $late;
            $parts = array_filter([
                $dueToday ? "{$dueToday} due today" : null,
                $late ? "{$late} overdue" : null,
            ]);
            $names = $trades->take(3)->map(fn ($t) => $t->description ?: ucfirst($t->status) . ' trade')->join(', ') . ($trades->count() > 3 ? '…' : '');
            $sent += Alerts::toEveryoneWith('trading', new AppAlert(
                'trades', 'Trades to complete: ' . implode(', ', $parts), $names,
                '/rucoy/trades', key: 'trades-' . $day,
            ));
        }

        // Accounts sold on payment: the payment date has come and it isn't fully paid
        $payments = RucoyAccount::active()->whereNotNull('payment_date')->where('payment_date', '<=', $day)
            ->where('payment_status', '!=', 'fully_paid')->orderBy('payment_date')->get();
        if ($payments->isNotEmpty()) {
            $n = $payments->count();
            $sent += Alerts::toEveryoneWith('trading', new AppAlert(
                'payments', $n === 1 ? 'A payment is due' : "{$n} payments are due",
                $payments->take(3)->map(fn ($a) => $a->description ?: $a->email)->join(', ') . ($n > 3 ? '…' : ''),
                '/business/transactions', key: 'payments-' . $day,
            ));
        }

        if ($today->isMonday()) {
            $sent += Alerts::toEveryoneWith('trading', new AppAlert(
                'brief', 'Your weekly brief is ready', 'Last week\'s profit, what sold, and what needs you this week.',
                '/business', key: 'brief-' . $today->format('o-\WW'),
            ));
        }

        // On the 1st: how last month went
        if ($today->day === 1 && ($recap = MonthRecap::forMonthBefore($today))) {
            $sent += Alerts::toEveryoneWith('trading', new AppAlert(
                'brief', $recap['title'], $recap['body'], '/business', key: 'recap-' . $recap['month'],
            ));
        }

        $sent += $this->followUps($today);
        $sent += $this->slowListings($today);
        $sent += $this->creditCards($today);

        $this->info("{$sent} alert(s) sent.");

        return self::SUCCESS;
    }

    /**
     * People with Wallets: a card payment due within 3 days or today (when something is owed), once
     * per due date at 3 days and again on the day; and a card past 80% of its limit, once a month.
     */
    private function creditCards(CarbonImmutable $today): int
    {
        $sent = 0;
        foreach (CreditCards::status($today) as $c) {
            $card = $c['account'];
            $owed = ($card->currency === 'PHP' ? '₱' : '$') . number_format($c['owed'], 2);

            if ($c['owed'] > 0 && $c['due_in'] !== null && $c['due_in'] <= CreditCards::DUE_SOON_DAYS) {
                $when = $c['due_in'] === 0 ? 'today' : ($c['due_in'] === 1 ? 'tomorrow' : "in {$c['due_in']} days");
                $sent += Alerts::toEveryoneWith('wallets', new AppAlert(
                    'card', "{$card->name} payment due {$when}",
                    "You owe {$owed} on it. Due " . $c['next_due']->format('M j') . '.',
                    '/master/balance',
                    // Once at "soon", once on the day
                    key: 'card-due-' . $card->id . '-' . $c['next_due']->format('Y-m-d') . ($c['due_in'] === 0 ? '-today' : ''),
                ));
            }

            if ($c['used'] !== null && $c['used'] >= CreditCards::HIGH_USE) {
                $pct = (int) round($c['used'] * 100);
                $sent += Alerts::toEveryoneWith('wallets', new AppAlert(
                    'card', "{$card->name} is at {$pct}% of its limit",
                    "You owe {$owed} of " . ($card->currency === 'PHP' ? '₱' : '$') . number_format($card->credit_limit, 2) . '. Pay some down before it\'s maxed out.',
                    '/master/balance', key: 'card-limit-' . $card->id . '-' . $today->format('Y-m') . ($c['used'] >= 1 ? '-over' : ''),
                ));
            }
        }

        return $sent;
    }

    /** Leads you messaged this many days ago that still have no outcome */
    public const FOLLOW_UP_DAYS = 3;

    /** Website leads marked "Messaged" FOLLOW_UP_DAYS+ ago with no "Deal done / No deal" since. */
    private function followUps(CarbonImmutable $today): int
    {
        if (! WebsiteStats::configured()) {
            return 0;
        }
        try {
            $leads = collect(WebsiteStats::rawLeads());
        } catch (Throwable) {
            return 0; // the website is down: try again tomorrow
        }
        $before = $today->subDays(self::FOLLOW_UP_DAYS)->getTimestampMs();
        $waiting = $leads->filter(fn ($l) => ($l['status'] ?? null) === 'contacted' && (int) ($l['updated_at'] ?? 0) <= $before)->sortBy('id');
        if ($waiting->isEmpty()) {
            return 0;
        }
        $n = $waiting->count();

        return Alerts::toEveryoneWith('storefront', new AppAlert(
            'lead',
            $n === 1 ? 'Follow up with a buyer' : "Follow up with {$n} buyers",
            // What they wanted, never their name (it shows on the lock screen)
            $waiting->take(3)->map(fn ($l) => WatchLeads::summary($l))->join(' · ') . ($n > 3 ? '…' : '') . ': messaged ' . self::FOLLOW_UP_DAYS . '+ days ago, no answer yet',
            '/business/leads',
            key: 'followup-' . $waiting->pluck('id')->join('-'),
        ));
    }

    /** Accounts listed longer than you usually take to sell (re-sent weekly while still slow). */
    private function slowListings(CarbonImmutable $today): int
    {
        $slow = collect(ListingPerformance::build($today)['listings'])
            ->filter(fn ($l) => in_array($l['verdict'], ListingPerformance::SLOW, true));
        if ($slow->isEmpty()) {
            return 0;
        }
        $n = $slow->count();

        return Alerts::toEveryoneWith('storefront', new AppAlert(
            'listings',
            $n === 1 ? 'A listing is slow to sell' : "{$n} listings are slow to sell",
            $slow->take(3)->map(fn ($l) => "{$l['name']} ({$l['days']} days)")->join(', ') . ($n > 3 ? '…' : '') . '. See why on Leads.',
            '/business/leads',
            key: 'slow-' . $slow->pluck('account_id')->sort()->join('-') . '-' . $today->format('o-\WW'),
        ));
    }
}
