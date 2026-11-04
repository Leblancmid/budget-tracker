<?php

namespace App\Services;

use App\Models\Transaction;

/** Mirrors a daily transaction into its Balance account (used by the API and recurring entries). */
class TransactionBalance
{
    /**
     * Income adds to the account, an expense deducts from it. No account → any previous
     * entry is removed.
     */
    public static function sync(Transaction $tx, ?string $account): void
    {
        $entry = $tx->balanceEntry()->first();

        if (! $account) {
            $entry?->delete();

            return;
        }

        $values = [
            'account'     => $account,
            'type'        => $tx->type === 'income' ? 'add' : 'sell',
            'amount'      => $tx->amount,
            'date'        => $tx->date->format('Y-m-d'),
            'description' => $tx->description ?: ($tx->category?->name ?? 'Daily transaction'),
        ];

        $entry ? $entry->update($values) : $tx->balanceEntry()->create($values);
    }
}
