<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBalanceAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            ...StoreBalanceAccountRequest::accountRules('sometimes'),
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'hidden'     => ['sometimes', 'boolean'],
        ];
    }
}
