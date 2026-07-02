<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSavingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'mode_of_payment' => 'sometimes|in:CIMB,MARIBANK,GCASH',
            'type'            => 'sometimes|in:deposit,withdraw',
            'transfer'        => 'nullable|in:daily_expenses,business',
            'description'     => 'nullable|string|max:255',
            'amount'          => 'sometimes|numeric|min:0.01',
            'date'            => 'sometimes|date',
        ];
    }
}
