<?php

namespace App\Providers;

use App\Models\AccountPayment;
use App\Models\BalanceAccount;
use App\Models\BalanceEntry;
use App\Models\BalanceTransfer;
use App\Models\Budget;
use App\Models\BusinessTransaction;
use App\Models\Category;
use App\Models\Gold;
use App\Models\GoldLog;
use App\Models\MiddlemanFee;
use App\Models\RecurringEntry;
use App\Models\RucoyAccount;
use App\Models\SiteSetting;
use App\Models\Trade;
use App\Models\Transaction;
use App\Observers\AccountPaymentObserver;
use App\Observers\BalanceAccountObserver;
use App\Observers\BalanceEntryObserver;
use App\Observers\BalanceTransferObserver;
use App\Observers\BudgetObserver;
use App\Observers\BusinessTransactionObserver;
use App\Observers\CategoryObserver;
use App\Observers\GoldLogObserver;
use App\Observers\GoldObserver;
use App\Observers\MiddlemanFeeLogObserver;
use App\Observers\MiddlemanFeeObserver;
use App\Observers\RecurringEntryObserver;
use App\Observers\RucoyAccountObserver;
use App\Observers\SiteSettingObserver;
use App\Observers\TradeObserver;
use App\Observers\TransactionObserver;
use App\Services\Undo\OperationRecorder;
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
        AccountPayment::observe(AccountPaymentObserver::class);
        RecurringEntry::observe(RecurringEntryObserver::class);
        // Logs page: everything else that can be added, edited or removed
        Category::observe(CategoryObserver::class);
        Budget::observe(BudgetObserver::class);
        BalanceAccount::observe(BalanceAccountObserver::class);
        BalanceTransfer::observe(BalanceTransferObserver::class);
        RucoyAccount::observe(RucoyAccountObserver::class);
        Gold::observe(GoldObserver::class);
        MiddlemanFee::observe(MiddlemanFeeLogObserver::class);
        SiteSetting::observe(SiteSettingObserver::class);

        // The undo journal: every row each action creates, changes or deletes (Master File → Undo)
        OperationRecorder::register();
    }
}
