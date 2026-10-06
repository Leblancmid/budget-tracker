<?php

namespace App\Observers;

use App\Models\ActivityLog;
use App\Models\Gold;
use App\Models\GoldLog;
use App\Models\MiddlemanFee;
use App\Models\Trade;

class TradeObserver
{
    public function created(Trade $model): void
    {
        ActivityLog::create([
            'user_id'       => auth()->id(),
            'loggable_type' => Trade::class,
            'loggable_id'   => $model->id,
            'module'        => 'trade',
            'type'          => $model->status,
            'description'   => $this->buildDescription($model),
            'amount'        => $model->amount,
            'ip_address'    => request()->ip(),
            'user_agent'    => request()->userAgent(),
        ]);

        // Handle middleman fee creation
        $this->handleMiddlemanFee($model);
    }

    public function updated(Trade $model): void
    {
        if ($model->isDirty('archived_at') && $model->archived_at !== null) {
            ActivityLog::create([
                'user_id'       => auth()->id(),
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

        // Handle middleman fee updates
        if ($model->isDirty('middleman_fee')) {
            $this->handleMiddlemanFee($model);
        }
    }

    private function handleMiddlemanFee(Trade $model): void
    {
        // Only handle for KKS trades
        if ($model->status !== 'kks') {
            return;
        }

        $existingFee = $model->middlemanFeeRecord;
        $newFeeAmount = $model->middleman_fee;

        // Case 1: No fee now, but there was one before - delete it
        if (!$newFeeAmount && $existingFee) {
            // Remove from gold stash
            Gold::create([
                'amount'      => -$existingFee->amount,
                'description' => 'MM Fee removed: ' . ($model->description ?? 'Trade #' . $model->id),
            ]);

            // Record in transaction history
            GoldLog::create([
                'type'        => 'fee',
                'amount'      => -$existingFee->amount,
                'description' => 'MM Fee removed: ' . ($model->description ?? 'Trade #' . $model->id),
            ]);

            $existingFee->delete();
            return;
        }

        // Case 2: There's a fee now
        if ($newFeeAmount) {
            if ($existingFee) {
                // Update existing fee - adjust the difference in gold
                $difference = $newFeeAmount - $existingFee->amount;

                if ($difference != 0) {
                    // Adjust gold stash by the difference
                    Gold::create([
                        'amount'      => $difference,
                        'description' => 'MM Fee adjusted: ' . ($model->description ?? 'Trade #' . $model->id),
                    ]);

                    // Record in transaction history
                    GoldLog::create([
                        'type'        => 'fee',
                        'amount'      => $difference,
                        'description' => 'MM Fee adjusted: ' . ($model->description ?? 'Trade #' . $model->id),
                    ]);

                    // Update the middleman fee record
                    $existingFee->update([
                        'amount'      => $newFeeAmount,
                        'description' => $model->description ?? 'Trade #' . $model->id,
                    ]);
                }
            } else {
                // Create new fee
                Gold::create([
                    'amount'      => $newFeeAmount,
                    'description' => $model->description ?? 'MM Fee',
                ]);

                GoldLog::create([
                    'type'        => 'fee',
                    'amount'      => $newFeeAmount,
                    'description' => $model->description ?? 'MM Fee',
                ]);

                MiddlemanFee::create([
                    'trade_id'    => $model->id,
                    'amount'      => $newFeeAmount,
                    'description' => $model->description ?? 'Trade #' . $model->id,
                ]);
            }
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
