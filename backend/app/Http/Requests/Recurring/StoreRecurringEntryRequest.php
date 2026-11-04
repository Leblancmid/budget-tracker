<?php

namespace App\Http\Requests\Recurring;

use App\Models\RecurringEntry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRecurringEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id'     => ['required', Rule::exists('categories', 'id')->where('user_id', auth()->id())],
            'type'            => ['required', 'in:income,expense'],
            'scope'           => ['sometimes', 'in:personal,business'],
            'amount'          => ['required', 'numeric', 'min:0.01', 'max:999999999.99'],
            'description'     => ['nullable', 'string', 'max:255'],
            // Daily amounts are in ₱, so only PHP balance accounts can be linked
            'balance_account' => ['nullable', 'string', Rule::exists('balance_accounts', 'code')->where('currency', 'PHP')],
            'frequency'       => ['required', Rule::in(RecurringEntry::FREQUENCIES)],
            'next_date'       => ['required', 'date_format:Y-m-d'],
            'active'          => ['sometimes', 'boolean'],
        ];
    }
}
