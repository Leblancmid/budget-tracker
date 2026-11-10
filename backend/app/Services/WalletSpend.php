<?php

namespace App\Services;

use App\Models\BalanceAccount;
use App\Models\BalanceEntry;
use App\Models\Category;
use App\Models\Transaction;

/**
 * Business money paid out of a Balance wallet (gold bought, accounts paid in cash).
 * Peso wallets also get a Business expense in Daily Expenses, so the spending shows there
 * (not counted in the personal totals); it owns the Balance entry, like any daily transaction.
 */
class WalletSpend
{
    /** Expense category the business spending is filed under, created on first use. */
    public const CATEGORY = 'Rucoy';

    /** @param array<string, mixed> $link extra balance_entries columns, e.g. business_transaction_id */
    public static function record(BalanceAccount $wallet, float $amount, string $date, string $description, array $link = []): BalanceEntry
    {
        $values = [
            'account'     => $wallet->code,
            'type'        => 'sell', // deducts from the wallet
            'amount'      => $amount,
            'date'        => $date,
            'description' => $description,
            ...$link,
        ];

        // Daily amounts are in ₱ and belong to a user, so only peso wallets with a signed-in user
        $userId = auth()->id();
        if ($wallet->currency === 'PHP' && $userId) {
            $category = Category::firstOrCreate(
                ['user_id' => $userId, 'name' => self::CATEGORY, 'type' => 'expense'],
                ['color' => '#f59e0b', 'icon' => 'gamepad'],
            );
            $values['transaction_id'] = Transaction::create([
                'user_id'     => $userId,
                'category_id' => $category->id,
                'type'        => 'expense',
                'scope'       => 'business',
                'amount'      => $amount,
                'date'        => $date,
                'description' => $description,
            ])->id;
        }

        return BalanceEntry::create($values);
    }

    /** Undo a payment: the wallet gets the money back and its Daily expense goes too. */
    public static function undo(BalanceEntry $entry): void
    {
        $transactionId = $entry->transaction_id;
        $entry->delete();
        if ($transactionId) {
            // Through the model, so it's logged and can be undone
            Transaction::find($transactionId)?->delete();
        }
    }
}
