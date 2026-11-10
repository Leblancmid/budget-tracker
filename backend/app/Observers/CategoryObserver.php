<?php

namespace App\Observers;

use Illuminate\Database\Eloquent\Model;

class CategoryObserver extends RecordLogObserver
{
    protected function module(): string
    {
        return 'daily';
    }

    protected function noun(): string
    {
        return 'Category';
    }

    protected function name(Model $model): string
    {
        return $model->name . ' (' . $model->type . ')';
    }
}
