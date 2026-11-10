<?php

namespace App\Observers;

use Illuminate\Database\Eloquent\Model;

/** Creating or changing a recurring entry shows on the Logs page under Daily. */
class RecurringEntryObserver extends ActivityLogObserver
{
    /** Posting moves the dates along by itself; that isn't an edit by the user. */
    protected array $ignoredOnEdit = ['updated_at', 'created_at', 'next_date', 'last_posted_on'];

    protected function module(): string
    {
        return 'daily';
    }

    /** A new recurring entry is its own "Added" line (it isn't listed from its table like daily entries) */
    protected function type(Model $model): ?string
    {
        return 'added';
    }

    protected function description(Model $model): ?string
    {
        return 'Recurring (' . $model->frequency . '): ' . ($model->description ?: 'no description');
    }
}
