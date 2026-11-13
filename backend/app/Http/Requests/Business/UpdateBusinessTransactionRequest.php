<?php

namespace App\Http\Requests\Business;

use App\Models\BusinessTransaction;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateBusinessTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * A gold trade's Price (G) and Cost (G) can't be edited: they change only through
     * Add Gold, Sell or account payments, which also keep the gold stash in step.
     * Re-sending the same value is fine. (Converting an account into a gold trade still sets them.)
     */
    public function after(): array
    {
        return [function (Validator $v) {
            $tx = $this->route('businessTransaction');
            if (! $tx instanceof BusinessTransaction || $tx->type !== 'gold') {
                return;
            }
            foreach (['price_gold', 'cost_gold'] as $field) {
                if ($this->has($field) && (float) $this->input($field) !== (float) $tx->{$field}) {
                    $v->errors()->add($field, 'Use Add Gold or Sell to change the gold on a trade.');
                }
            }
        }];
    }

    public function rules(): array
    {
        return [
            'type'        => 'sometimes|in:account,gold,expense',
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
            'amount'      => 'sometimes|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
            'date'        => 'sometimes|date',
            'notes'       => 'nullable|string|max:5000',
            'sold_to'     => 'nullable|string|max:100',
        ];
    }
}
