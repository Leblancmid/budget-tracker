<?php

namespace App\Observers;

use App\Models\AccountPayment;
use Illuminate\Database\Eloquent\Model;

/** Account payments on the Logs page: who paid what (as a ₱ cost), and removals. */
class AccountPaymentObserver extends ActivityLogObserver
{
    protected function module(): string
    {
        return 'business';
    }

    protected function type(Model $model): ?string
    {
        return 'payment';
    }

    /** @param AccountPayment $model */
    protected function description(Model $model): ?string
    {
        return $model->summary();
    }

    /** A payment is money spent: shown as a negative ₱ amount. */
    protected function amount(Model $model): mixed
    {
        return $model->cost_php !== null ? -$model->cost_php : null;
    }
    // Removing a payment leaves a "Removed: …" line (ActivityLogObserver::deleted)
}
