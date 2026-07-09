<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;

class StoreSavingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'mode_of_payment' => 'required|in:CIMB,MARIBANK,GCASH',
            'type'            => 'required|in:deposit,withdraw',
            'description'     => 'nullable|string|max:255',
            'amount'          => 'required|numeric|min:0.01',
            'date'            => 'required|date',
        ];
    }
}
