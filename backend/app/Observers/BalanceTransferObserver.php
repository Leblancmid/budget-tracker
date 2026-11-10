<?php

namespace App\Observers;

use App\Models\BalanceAccount;
use Illuminate\Database\Eloquent\Model;

class BalanceTransferObserver extends RecordLogObserver
{
    protected function module(): string
    {
        return 'balance';
    }

    protected function noun(): string
    {
        return 'Transfer';
    }

    /** "PayPal → GCash, 1,000.00 (fee 15.00)": in words, since the two wallets can be in different currencies */
    protected function name(Model $model): string
    {
        $names = BalanceAccount::whereIn('code', [$model->from_account, $model->to_account])->pluck('name', 'code');
        $fee = (float) $model->fee > 0 ? ' (fee ' . number_format((float) $model->fee, 2) . ')' : '';

        return ($names[$model->from_account] ?? $model->from_account) . ' → ' . ($names[$model->to_account] ?? $model->to_account)
            . ', ' . number_format((float) $model->amount, 2) . $fee;
    }
}
