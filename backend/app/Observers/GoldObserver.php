<?php

namespace App\Observers;

use Illuminate\Database\Eloquent\Model;

/** Gold stash entries edited or deleted by hand. Adding to the stash is logged on the gold history. */
class GoldObserver extends RecordLogObserver
{
    protected bool $logsCreate = false;

    protected function module(): string
    {
        return 'gold';
    }

    protected function noun(): string
    {
        return 'Stash entry';
    }

    protected function name(Model $model): string
    {
        return $model->description ?: 'no description';
    }

    protected function amount(Model $model): mixed
    {
        return $model->amount;
    }
}
