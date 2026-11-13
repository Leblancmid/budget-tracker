<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\DailyEntryAccess;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTransactionRequest extends FormRequest
{
    use DailyEntryAccess;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', Rule::exists('categories', 'id')->where('user_id', auth()->id())],
            'type'        => ['required', 'in:income,expense'],
            'amount'      => ['required', 'numeric', 'min:0.01', 'max:999999999.99'],
            'description' => ['nullable', 'string', 'max:255'],
            'date'        => ['required', 'date'],
            'notes'       => ['nullable', 'string', 'max:1000'],
            ...$this->accessRules(),
            // Set by the phone for entries added offline, so a resend can't save twice
            'client_id'       => ['nullable', 'uuid'],
        ];
    }
}
