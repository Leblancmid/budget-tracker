<?php

namespace App\Observers;

use Illuminate\Database\Eloquent\Model;

/** Account details (stats, email, listing, screenshot). Adding and selling one are logged on its sale record. */
class RucoyAccountObserver extends RecordLogObserver
{
    protected bool $logsCreate = false;

    protected array $ignoredOnEdit = ['updated_at', 'created_at', 'archived_at', 'listed_at'];

    protected function module(): string
    {
        return 'business';
    }

    protected function noun(): string
    {
        return 'Account';
    }

    protected function name(Model $model): string
    {
        return $model->description ?: $model->email;
    }
}
