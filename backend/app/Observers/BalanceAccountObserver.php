<?php

namespace App\Observers;

use Illuminate\Database\Eloquent\Model;

class BalanceAccountObserver extends RecordLogObserver
{
    /** Reordering (logged once as "Reordered wallets") and daily interest bookkeeping aren't edits */
    protected array $ignoredOnEdit = ['updated_at', 'created_at', 'sort_order', 'interest_credited_through'];

    protected function module(): string
    {
        return 'balance';
    }

    protected function noun(): string
    {
        return 'Wallet';
    }

    protected function name(Model $model): string
    {
        return $model->name . ' (' . $model->currency . ')';
    }
}
