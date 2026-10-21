<?php

namespace App\Http\Requests\Business;

use Illuminate\Foundation\Http\FormRequest;

class SellBusinessTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount'           => ['required', 'numeric', 'min:1'],
            'deduct_inventory' => ['sometimes', 'boolean'],
            'description'      => ['nullable', 'string', 'max:255'],
        ];
    }
}
