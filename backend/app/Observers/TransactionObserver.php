<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\Transaction;

class TransactionObserver
{
    public function created(Transaction $model): void
    {
        ActivityLog::create([
            'user_id'       => auth()->id(),
            'loggable_type' => Transaction::class,
            'loggable_id'   => $model->id,
            'module'        => 'daily',
            'type'          => $model->type,
            'description'   => $model->description,
            'amount'        => $model->amount,
            'ip_address'    => request()->ip(),
            'user_agent'    => request()->userAgent(),
        ]);
    }

    public function updated(Transaction $model): void
    {
        // Skip logging if only timestamps changed
        if ($model->isDirty() && !$this->onlyTimestampsChanged($model)) {
            ActivityLog::create([
                'user_id'       => auth()->id(),
                'loggable_type' => Transaction::class,
                'loggable_id'   => $model->id,
                'module'        => 'daily',
                'type'          => 'edited',
                'description'   => $model->description,
                'amount'        => $model->amount,
                'ip_address'    => request()->ip(),
                'user_agent'    => request()->userAgent(),
            ]);
        }
    }

    private function onlyTimestampsChanged(Transaction $model): bool
    {
        $dirty = array_keys($model->getDirty());
        $timestampFields = ['updated_at', 'created_at'];
        
        return count($dirty) === count(array_intersect($dirty, $timestampFields));
    }
}
