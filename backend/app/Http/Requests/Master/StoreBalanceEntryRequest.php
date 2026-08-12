<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;

class StoreBalanceEntryRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'account'     => 'required|in:PAYPAL,BINANCE',
            'type'        => 'required|in:add,sell',
            'description' => 'nullable|string|max:255',
            'amount'      => 'required|numeric|min:0.01',
            'date'        => 'required|date',
        ];
    }
}
