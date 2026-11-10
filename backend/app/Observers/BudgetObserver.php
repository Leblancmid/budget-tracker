<?php

namespace App\Observers;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class BudgetObserver extends RecordLogObserver
{
    protected function module(): string
    {
        return 'daily';
    }

    protected function noun(): string
    {
        return 'Budget';
    }

    /** "Food, Nov 2026" */
    protected function name(Model $model): string
    {
        $month = Carbon::create((int) $model->year, (int) $model->month, 1)->format('M Y');

        return ($model->category?->name ?? 'Category #' . $model->category_id) . ', ' . $month;
    }

    protected function amount(Model $model): mixed
    {
        return $model->amount;
    }
}
