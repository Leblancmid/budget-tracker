<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\GoldLog;

class GoldLogObserver
{
    public function created(GoldLog $model): void
    {
        ActivityLog::create([
            'loggable_type' => GoldLog::class,
            'loggable_id'   => $model->id,
            'module'        => 'gold',
            'type'          => $model->type,
            'description'   => $model->description,
            'amount'        => $model->amount,
            'ip_address'    => request()->ip(),
            'user_agent'    => request()->userAgent(),
        ]);
    }
}
