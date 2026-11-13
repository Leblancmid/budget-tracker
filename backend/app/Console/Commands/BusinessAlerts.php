<?php

namespace App\Console\Commands;

use App\Models\RucoyAccount;
use App\Models\Trade;
use App\Notifications\AppAlert;
use App\Services\Alerts;
use App\Services\BalanceInterest;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;

/**
 * Every morning (Manila): tells people with Trading what's due (trades to complete, account
 * payments to collect) and, on Mondays, that the weekly brief is ready. Each alert once a day.
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

        $this->info("{$sent} alert(s) sent.");

        return self::SUCCESS;
    }
}
