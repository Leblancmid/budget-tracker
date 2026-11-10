<?php

namespace App\Observers;

use Illuminate\Database\Eloquent\Model;

/** Middleman fees on the Logs page (MiddlemanFeeObserver keeps the fee trade in step). */
class MiddlemanFeeLogObserver extends RecordLogObserver
{
    protected function module(): string
    {
        return 'gold';
    }

    protected function noun(): string
    {
        return 'MM fee';
    }

    protected function name(Model $model): string
    {
        return $model->description ?: 'Trade #' . $model->trade_id;
    }

    protected function amount(Model $model): mixed
    {
        return $model->amount;
    }
}
