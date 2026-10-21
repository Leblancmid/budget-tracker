<?php

namespace App\Http\Requests\Rucoy;

use Illuminate\Foundation\Http\FormRequest;

class SellGoldRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount'      => ['required', 'numeric', 'min:0.01'],
            'description' => ['nullable', 'string', 'max:255'],
        ];
    }
}
