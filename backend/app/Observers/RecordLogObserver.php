<?php

namespace App\Observers;

use Illuminate\Database\Eloquent\Model;

/**
 * Logs for records that don't have their own list on the Logs page (categories, budgets, wallets…):
 * adding one is an "Added" line of its own, and the line names the kind of record ("Wallet: GCash").
 */
abstract class RecordLogObserver extends ActivityLogObserver
{
    /** "Wallet", "Category"… */
    abstract protected function noun(): string;

    /** The record's name, e.g. "GCash" */
    abstract protected function name(Model $model): string;

    protected function type(Model $model): ?string
    {
        return 'added';
    }

    protected function description(Model $model): ?string
    {
        return $this->noun() . ': ' . $this->name($model);
    }

    protected function amount(Model $model): mixed
    {
        return null;
    }
}
