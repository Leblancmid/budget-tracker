<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\Saving;

class SavingObserver
{
    public function created(Saving $model): void
    {
        ActivityLog::create([
            'loggable_type' => Saving::class,
            'loggable_id'   => $model->id,
            'module'        => 'savings',
            'type'          => $model->type,
            'description'   => $model->description,
            'amount'        => $model->amount,
            'ip_address'    => request()->ip(),
            'user_agent'    => request()->userAgent(),
        ]);
    }
}
