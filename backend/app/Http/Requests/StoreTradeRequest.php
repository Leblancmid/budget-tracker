<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTradeRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'description'     => ['nullable', 'string', 'max:255'],
            'status'          => ['required', 'in:kks,cash'],
            'amount'          => ['required', 'numeric', 'min:0'],
            'currency'        => ['nullable', 'in:USD,EUR,PHP'],
            'payment_method'  => ['nullable', 'in:binance,paypal'],
            'start_date'      => ['nullable', 'date'],
            'completion_date' => ['nullable', 'date'],
        ];
    }
}
