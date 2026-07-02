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
            'amount'      => 'sometimes|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
            'date'        => 'sometimes|date',
            'notes'       => 'nullable|string|max:5000',
        ];
    }
}
