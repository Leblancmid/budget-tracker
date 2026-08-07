<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\BusinessTransaction;

class BusinessTransactionObserver
{
    public function created(BusinessTransaction $model): void
    {
        ActivityLog::create([
            'loggable_type' => BusinessTransaction::class,
            'loggable_id'   => $model->id,
            'module'        => 'business',
            'type'          => $model->type,
            'description'   => $model->description,
            'amount'        => $model->profit_php ?? $model->price_php ?? $model->cost_php ?? $model->amount,
            'ip_address'    => request()->ip(),
            'user_agent'    => request()->userAgent(),
        ]);
    }

    public function updated(BusinessTransaction $model): void
    {
        if ($model->isDirty('archived_at') && $model->archived_at !== null) {
            ActivityLog::create([
                'loggable_type' => BusinessTransaction::class,
                'loggable_id'   => $model->id,
                'module'        => 'business',
                'type'          => 'archived',
                'description'   => $model->description,
                'amount'        => $model->profit_php ?? $model->price_php ?? $model->cost_php ?? $model->amount,
                'ip_address'    => request()->ip(),
                'user_agent'    => request()->userAgent(),
            ]);
        }
    }
}
