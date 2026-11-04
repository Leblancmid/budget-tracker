<?php

namespace App\Http\Requests\Business;

use App\Http\Requests\Business\Concerns\ValidatesWalletPayment;
use App\Models\BusinessTransaction;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreBusinessTransactionRequest extends FormRequest
{
    use ValidatesWalletPayment;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type'        => 'required|in:account,gold,expense',
            'action'      => 'nullable|in:buy,sell',
            'account_id'  => 'nullable|integer|exists:rucoy_accounts,id',
            'price_rate'  => 'nullable|numeric|min:0',
            'cost_rate'   => 'nullable|numeric|min:0',
            'php_rate'      => 'nullable|numeric|min:0',
            'cost_php_rate' => 'nullable|numeric|min:0',
            'price_gold'  => 'nullable|numeric|min:0',
            'cost_gold'   => 'nullable|numeric|min:0',
            'price_gold_received' => 'nullable|numeric|min:0',
            'cost_gold_paid'      => 'nullable|numeric|min:0',
            'price_php'   => 'nullable|numeric',
            'cost_php'    => 'nullable|numeric',
            'amount'      => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
            'date'        => 'required|date',
            'notes'       => 'nullable|string|max:5000',
            ...$this->walletRules(),
        ];
    }

    public function after(): array
    {
        return [function (Validator $v) {
            if (! $this->filled('balance_account')) {
                return;
            }
            if ($this->input('type') !== 'gold') {
                $v->errors()->add('balance_account', 'Only gold you buy can be paid from a wallet here.');

                return;
            }
            $trade   = new BusinessTransaction($this->only(['cost_rate', 'php_rate', 'cost_php_rate', 'price_gold', 'cost_gold']));
            $costPhp = (float) $this->input('cost_php', 0);
            $this->checkWalletPayment($v, $trade, $trade->boughtGold(), $costPhp > 0 ? $costPhp : null);
        }];
    }
}
