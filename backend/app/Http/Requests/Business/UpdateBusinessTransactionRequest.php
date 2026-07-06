<?php

namespace App\Http\Requests\Business;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBusinessTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type'        => 'sometimes|in:account,gold,expense',
            'action'      => 'nullable|in:buy,sell',
            'account_id'  => 'nullable|integer|exists:rucoy_accounts,id',
            'price_rate'  => 'nullable|numeric|min:0',
            'cost_rate'   => 'nullable|numeric|min:0',
            'php_rate'    => 'nullable|numeric|min:0',
            'price_php'   => 'nullable|numeric|min:0',
            'cost_php'    => 'nullable|numeric|min:0',
            'profit_php'  => 'nullable|numeric',
            'amount'      => 'sometimes|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
            'date'        => 'sometimes|date',
            'notes'       => 'nullable|string|max:5000',
        ];
    }
}
