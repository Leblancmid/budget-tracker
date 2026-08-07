<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\Trade;

class TradeObserver
{
    public function created(Trade $model): void
    {
        ActivityLog::create([
            'loggable_type' => Trade::class,
            'loggable_id'   => $model->id,
            'module'        => 'trade',
            'type'          => $model->status,
            'description'   => $this->buildDescription($model),
            'amount'        => $model->amount,
            'ip_address'    => request()->ip(),
            'user_agent'    => request()->userAgent(),
        ]);
    }

    public function updated(Trade $model): void
    {
        if ($model->isDirty('archived_at') && $model->archived_at !== null) {
            ActivityLog::create([
                'loggable_type' => Trade::class,
                'loggable_id'   => $model->id,
                'module'        => 'trade',
                'type'          => 'archived',
                'description'   => $this->buildDescription($model),
                'amount'        => $model->amount,
                'ip_address'    => request()->ip(),
                'user_agent'    => request()->userAgent(),
            ]);
        }
    }

    private function buildDescription(Trade $model): ?string
    {
        $description = $model->description;
        if ($model->currency) {
            $description = trim(($description ? $description . ' · ' : '') . $model->currency);
        }
        return $description ?: null;
    }
}
