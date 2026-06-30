<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['sometimes', 'required', 'exists:categories,id'],
            'type'        => ['sometimes', 'required', 'in:income,expense'],
            'amount'      => ['sometimes', 'required', 'numeric', 'min:0.01', 'max:999999999.99'],
            'description' => ['nullable', 'string', 'max:255'],
            'date'        => ['sometimes', 'required', 'date'],
            'notes'       => ['nullable', 'string', 'max:1000'],
        ];
    }
}
