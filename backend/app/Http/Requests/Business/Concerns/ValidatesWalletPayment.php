<?php

namespace App\Http\Requests\Business\Concerns;

use App\Models\BalanceAccount;
use App\Models\BusinessTransaction;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/** Paying for bought gold from a Balance wallet: the wallet must exist and the cost must be priced. */
trait ValidatesWalletPayment
{
    protected function walletRules(): array
    {
        return [
            'balance_account' => ['nullable', 'string', Rule::exists('balance_accounts', 'code')->whereNull('hidden_at')],
        ];
    }

    /**
     * $trade carries the cost rates the gold is bought at; $gold is the gold being bought and
     * $costPhp the ₱ actually paid for it, when it was typed in.
     */
    protected function checkWalletPayment(Validator $v, BusinessTransaction $trade, float $gold, ?float $costPhp = null): void
    {
        if (! $this->filled('balance_account') || $v->errors()->has('balance_account')) {
            return;
        }
        $wallet = BalanceAccount::where('code', $this->input('balance_account'))->first();
        if (! $wallet) {
            return;
        }
        if ($gold <= 0 && ! ($costPhp > 0)) {
            $v->errors()->add('balance_account', 'Enter the cost you paid to pay for it from a wallet.');
        } elseif ($trade->walletCost($gold, $wallet->currency, $costPhp) === null) {
            $v->errors()->add('balance_account', $wallet->currency === 'USD'
                ? 'Enter the Cost Rate to pay from a dollar wallet.'
                : 'Enter the Cost Rate and PHP Rate to pay from a wallet.');
        }
    }
}
