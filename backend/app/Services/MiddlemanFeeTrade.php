<?php

namespace App\Services;

use App\Models\BusinessTransaction;
use App\Models\MiddlemanFee;
use App\Support\SchemaColumns;

/**
 * The pinned "Middleman Fee" gold trade. Every middleman fee adds its gold to
 * this trade's price; it can be edited, topped up and sold, but never deleted.
 */
class MiddlemanFeeTrade
{
    public const KEY = 'middleman_fee';

    public static function get(): ?BusinessTransaction
    {
        if (! SchemaColumns::has('business_transactions', 'system_key')) {
            return null;
        }

        $tx = BusinessTransaction::where('system_key', self::KEY)->first();
        if ($tx) {
            return $tx;
        }

        // First use: start from this month's fees (later fees are added as they come in)
        return BusinessTransaction::create([
            'system_key'  => self::KEY,
            'type'        => 'gold',
            'action'      => null,
            'description' => 'Middleman Fee',
            'amount'      => 0.01,
            'date'        => now()->toDateString(),
            'price_gold'  => (float) MiddlemanFee::whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])->sum('amount'),
            'cost_gold'   => 0,
            'cost_php'    => 0,
        ]);
    }

    /** Add (or, if negative, remove) gold from the trade's price and refresh its ₱ values. */
    public static function adjust(float $gold): void
    {
        if ($gold == 0) {
            return;
        }
        $tx = self::get();
        if (! $tx) {
            return;
        }

        $tx->price_gold = max(0, (float) $tx->price_gold + $gold);
        $tx->recomputeGoldPhp();
        $tx->save();
    }
}
