<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\BusinessTransaction;

class BusinessTransactionObserver
{
    public function created(BusinessTransaction $model): void
    {
        ActivityLog::create([
            'user_id'       => auth()->id(),
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
        // Log archive events
        if ($model->isDirty('archived_at') && $model->archived_at !== null) {
            ActivityLog::create([
                'user_id'       => auth()->id(),
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
        // Log regular edit events (excluding archive and timestamp-only changes)
        elseif ($model->isDirty() && !$this->onlyTimestampsChanged($model)) {
            ActivityLog::create([
                'user_id'       => auth()->id(),
                'loggable_type' => BusinessTransaction::class,
                'loggable_id'   => $model->id,
                'module'        => 'business',
                'type'          => 'edited',
                'description'   => $model->description,
                'amount'        => $model->profit_php ?? $model->price_php ?? $model->cost_php ?? $model->amount,
                'ip_address'    => request()->ip(),
                'user_agent'    => request()->userAgent(),
            ]);
        }
    }

    private function onlyTimestampsChanged(BusinessTransaction $model): bool
    {
        $dirty = array_keys($model->getDirty());
        $timestampFields = ['updated_at', 'created_at', 'archived_at'];
        
        return count($dirty) === count(array_intersect($dirty, $timestampFields));
    }
}
