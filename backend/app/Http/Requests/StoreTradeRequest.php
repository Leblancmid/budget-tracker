<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTradeRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'gold_id'     => ['required', 'exists:golds,id'],
            'description' => ['nullable', 'string', 'max:255'],
            'status'      => ['required', 'in:kks,cash'],
            'amount'      => ['required', 'numeric', 'min:0.01', 'max:999999999.99'],
        ];
    }
}
