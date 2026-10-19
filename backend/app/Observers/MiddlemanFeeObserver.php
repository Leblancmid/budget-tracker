<?php

namespace App\Observers;

use App\Models\MiddlemanFee;
use App\Services\MiddlemanFeeTrade;

/** Mirrors every middleman fee (Golds page or KKS trades) into the pinned Middleman Fee gold trade. */
class MiddlemanFeeObserver
{
    public function created(MiddlemanFee $fee): void
    {
        MiddlemanFeeTrade::adjust((float) $fee->amount);
    }

    public function updated(MiddlemanFee $fee): void
    {
        if ($fee->wasChanged('amount')) {
            MiddlemanFeeTrade::adjust((float) $fee->amount - (float) $fee->getOriginal('amount'));
        }
    }

    public function deleted(MiddlemanFee $fee): void
    {
        MiddlemanFeeTrade::adjust(-(float) $fee->amount);
    }
}
