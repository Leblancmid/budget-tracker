<?php

namespace App\Providers;

use App\Models\BalanceEntry;
use App\Models\BusinessTransaction;
use App\Models\GoldLog;
use App\Models\MiddlemanFee;
use App\Models\Trade;
use App\Models\Transaction;
use App\Observers\BalanceEntryObserver;
use App\Observers\BusinessTransactionObserver;
use App\Observers\GoldLogObserver;
use App\Observers\MiddlemanFeeObserver;
use App\Observers\TradeObserver;
use App\Observers\TransactionObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Transaction::observe(TransactionObserver::class);
        BusinessTransaction::observe(BusinessTransactionObserver::class);
        BalanceEntry::observe(BalanceEntryObserver::class);
        GoldLog::observe(GoldLogObserver::class);
        Trade::observe(TradeObserver::class);
        MiddlemanFee::observe(MiddlemanFeeObserver::class);
    }
}
