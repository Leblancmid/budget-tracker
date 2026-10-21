<?php

namespace App\Observers;

use App\Models\MiddlemanFee;
use App\Models\Trade;
use App\Services\GoldInventory;
use Illuminate\Database\Eloquent\Model;

class TradeObserver extends ActivityLogObserver
{
    /** Middleman fee changes are logged through the gold history instead. */
    protected array $ignoredOnEdit = ['updated_at', 'created_at', 'archived_at', 'middleman_fee'];

    protected bool $logsArchive = true;

    /** @param Trade $model */
    public function created(Model $model): void
    {
        parent::created($model);

        $this->handleMiddlemanFee($model);
    }

    /** @param Trade $model */
    public function updated(Model $model): void
    {
        parent::updated($model);

        if ($model->isDirty('middleman_fee')) {
            $this->handleMiddlemanFee($model);
        }
    }

    protected function module(): string
    {
        return 'trade';
    }

    /** @param Trade $model */
    protected function type(Model $model): ?string
    {
        return $model->status;
    }

    /** @param Trade $model */
    protected function description(Model $model): ?string
    {
        $description = $model->description;
        if ($model->currency) {
            $description = trim(($description ? $description . ' · ' : '') . $model->currency);
        }

        return $description ?: null;
    }

    /** Keep a KKS trade's middleman fee record, and the gold stash, in step with its fee. */
    private function handleMiddlemanFee(Trade $model): void
    {
        if ($model->status !== 'kks') {
            return;
        }

        $existingFee  = $model->middlemanFeeRecord;
        $newFeeAmount = $model->middleman_fee;
        $label        = $model->description ?? 'Trade #' . $model->id;

        // Fee removed
        if (! $newFeeAmount && $existingFee) {
            GoldInventory::record(-$existingFee->amount, 'MM Fee removed: ' . $label, 'fee');
            $existingFee->delete();

            return;
        }

        if (! $newFeeAmount) {
            return;
        }

        // Fee changed: move only the difference
        if ($existingFee) {
            $difference = $newFeeAmount - $existingFee->amount;
            if ($difference != 0) {
                GoldInventory::record($difference, 'MM Fee adjusted: ' . $label, 'fee');
                $existingFee->update([
                    'amount'      => $newFeeAmount,
                    'description' => $label,
                ]);
            }

            return;
        }

        // New fee
        GoldInventory::record($newFeeAmount, $model->description ?? 'MM Fee', 'fee');
        MiddlemanFee::create([
            'trade_id'    => $model->id,
            'amount'      => $newFeeAmount,
            'description' => $label,
        ]);
    }
}
