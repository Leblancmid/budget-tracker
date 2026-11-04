<?php

namespace App\Services;

use App\Models\AccountPayment;
use App\Models\BalanceAccount;
use App\Models\BalanceEntry;
use App\Models\BusinessTransaction;
use App\Models\RucoyAccount;
use Illuminate\Support\Facades\DB;

/** Paying toward an account's cost with gold from a gold trade or cash from a Balance wallet. */
class AccountPaymentService
{
    public function __construct(private readonly BusinessTransactionService $transactions) {}

    /** @param array{method: string, gold: float|string, date: string, note?: ?string, source_trade_id?: int, balance_account?: string, cash_amount?: float|string, php_rate?: float|string|null} $data */
    public function add(RucoyAccount $account, array $data): AccountPayment
    {
        return DB::transaction(function () use ($account, $data) {
            $gold  = (float) $data['gold'];
            $label = 'Paid for account: ' . ($account->description ?: $account->email);
            $values = [
                'method' => $data['method'],
                'gold'   => $gold,
                'date'   => $data['date'],
                'note'   => $data['note'] ?? null,
            ];

            if ($data['method'] === 'gold_trade') {
                $trade = BusinessTransaction::lockForUpdate()->findOrFail($data['source_trade_id']);
                $taken = $this->transactions->takeGold($trade, $gold, $label);
                $values += [
                    'source_trade_id' => $taken['removed'] ? null : $trade->id,
                    'taken'           => $taken,
                    'cost_php'        => (float) $taken['cost_php'],
                    'cost_rate'       => $trade->cost_rate,
                    'cost_php_rate'   => $trade->cost_php_rate ?? $trade->php_rate,
                ];
            } else {
                $wallet = BalanceAccount::where('code', $data['balance_account'])->firstOrFail();
                $cash   = round((float) $data['cash_amount'], 2);
                $rate   = $wallet->currency === 'PHP' ? 1.0 : (float) $data['php_rate'];
                // Peso wallets also show as a Business expense in Daily Expenses
                $entry  = WalletSpend::record($wallet, $cash, $data['date'], $label);
                $values += [
                    'balance_entry_id' => $entry->id,
                    'balance_account'  => $wallet->code,
                    'cash_amount'      => $cash,
                    'currency'         => $wallet->currency,
                    'cost_php_rate'    => $wallet->currency === 'PHP' ? null : $rate,
                    'cost_php'         => round($cash * $rate, 2),
                ];
            }

            $payment = $account->payments()->create($values);
            AccountCost::sync($account);

            return $payment;
        });
    }

    /** Remove a payment and undo it: gold goes back to its trade (and the stash), cash back to the wallet. */
    public function remove(AccountPayment $payment): void
    {
        DB::transaction(function () use ($payment) {
            $account = $payment->account;

            if ($payment->method === 'gold_trade' && $payment->taken) {
                $trade = $payment->source_trade_id
                    ? BusinessTransaction::lockForUpdate()->find($payment->source_trade_id)
                    : null;
                $this->transactions->returnGold($trade, $payment->taken, 'Returned: account payment removed (' . ($account->description ?: $account->email) . ')');
            }
            if ($payment->balance_entry_id) {
                $entry = BalanceEntry::find($payment->balance_entry_id);
                if ($entry) {
                    WalletSpend::undo($entry);
                }
            }

            $payment->delete();
            AccountCost::sync($account);
        });
    }
}
