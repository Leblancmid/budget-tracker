<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;

class CheckBalanceAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // What the bank / e-wallet app shows right now (can be negative, e.g. a credit line)
            'actual' => ['required', 'numeric', 'min:-999999999.99', 'max:999999999.99'],
            'note'   => ['nullable', 'string', 'max:100'],
        ];
    }
}
