<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', 'exists:categories,id'],
            'type'        => ['required', 'in:income,expense'],
            'amount'      => ['required', 'numeric', 'min:0.01', 'max:999999999.99'],
            'description' => ['nullable', 'string', 'max:255'],
            'date'        => ['required', 'date'],
            'notes'       => ['nullable', 'string', 'max:1000'],
        ];
    }
}
