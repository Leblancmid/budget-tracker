<?php

namespace App\Services;

use App\Models\Gold;
use App\Models\GoldLog;

class GoldInventory
{
    /**
     * Put gold into the stash (or take it out, if negative) and record it in the
     * gold history under the given log type ('add' or 'fee').
     */
    public static function record(float $amount, ?string $description, string $logType = 'add'): Gold
    {
        $gold = Gold::create(['amount' => $amount, 'description' => $description]);

        GoldLog::create([
            'type'        => $logType,
            'amount'      => $amount,
            'description' => $description,
        ]);

        return $gold;
    }

    /**
     * Deduct gold from the inventory, largest entries first. Any shortfall is
     * recorded as a negative entry so the inventory total stays accurate.
     */
    public static function deduct(float $amount, ?string $description = null): void
    {
        $remaining = $amount;
        foreach (Gold::orderByDesc('amount')->get() as $gold) {
            if ($remaining <= 0) {
                break;
            }
            $current = (float) $gold->amount;
            $deduct  = min($current, $remaining);
            $gold->update(['amount' => $current - $deduct]);
            $remaining -= $deduct;
        }

        if ($remaining > 0) {
            Gold::create(['amount' => -$remaining, 'description' => null]);
        }

        GoldLog::create([
            'type'        => 'sell',
            'amount'      => $amount,
            'description' => $description,
        ]);
    }
}
