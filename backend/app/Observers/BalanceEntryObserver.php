<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\BalanceEntry;

class BalanceEntryObserver
{
    public function created(BalanceEntry $model): void
    {
        ActivityLog::create([
            'loggable_type' => BalanceEntry::class,
            'loggable_id'   => $model->id,
            'module'        => 'balance',
            'type'          => $model->type,
            'description'   => $model->description,
            'amount'        => $model->amount,
            'ip_address'    => request()->ip(),
            'user_agent'    => request()->userAgent(),
        ]);
    }
}
