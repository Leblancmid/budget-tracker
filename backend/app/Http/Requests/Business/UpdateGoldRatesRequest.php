<?php

namespace App\Http\Requests\Business;

use Illuminate\Foundation\Http\FormRequest;

/** The gold rates shown on the website, per 1KK (1,000,000) gold. */
class UpdateGoldRatesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rates'            => ['present', 'array', 'max:6'],
            'rates.*.method'   => ['required', 'string', 'max:30', 'distinct'],
            'rates.*.currency' => ['required', 'in:USD,PHP'],
            'rates.*.per_kk'   => ['required', 'numeric', 'gt:0', 'max:10000'],
            'min_order_kk'     => ['nullable', 'integer', 'min:1', 'max:100000'],
            'note'             => ['nullable', 'string', 'max:160'],
        ];
    }

    public function messages(): array
    {
        return [
            'rates.*.method.required' => 'Name the payment method, e.g. Binance.',
            'rates.*.method.distinct' => 'Each payment method only once.',
            'rates.*.per_kk.required' => 'Enter the price per 1KK.',
            'rates.*.per_kk.gt'       => 'The price must be above 0.',
        ];
    }
}
