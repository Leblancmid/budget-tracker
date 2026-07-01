<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTradeRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'gold_id'     => ['sometimes', 'required', 'exists:golds,id'],
            'description' => ['nullable', 'string', 'max:255'],
            'status'      => ['sometimes', 'required', 'in:kks,cash'],
            'amount'      => ['sometimes', 'required', 'numeric', 'min:0.01', 'max:999999999.99'],
        ];
    }
}
