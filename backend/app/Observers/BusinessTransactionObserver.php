<?php

namespace App\Observers;

use App\Models\BusinessTransaction;
use Illuminate\Database\Eloquent\Model;

class BusinessTransactionObserver extends ActivityLogObserver
{
    protected array $ignoredOnEdit = ['updated_at', 'created_at', 'archived_at'];

    protected bool $logsArchive = true;

    protected function module(): string
    {
        return 'business';
    }

    /** @param BusinessTransaction $model */
    protected function amount(Model $model): mixed
    {
        return $model->profit_php ?? $model->price_php ?? $model->cost_php ?? $model->amount;
    }
}
