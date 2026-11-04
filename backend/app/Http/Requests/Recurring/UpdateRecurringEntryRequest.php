<?php

namespace App\Http\Requests\Recurring;

use App\Models\RecurringEntry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRecurringEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('recurringEntry'));
    }

    public function rules(): array
    {
        return [
            'category_id'     => ['sometimes', 'required', Rule::exists('categories', 'id')->where('user_id', auth()->id())],
            'type'            => ['sometimes', 'required', 'in:income,expense'],
            'scope'           => ['sometimes', 'in:personal,business'],
            'amount'          => ['sometimes', 'required', 'numeric', 'min:0.01', 'max:999999999.99'],
            'description'     => ['nullable', 'string', 'max:255'],
            'balance_account' => ['nullable', 'string', Rule::exists('balance_accounts', 'code')->where('currency', 'PHP')],
            'frequency'       => ['sometimes', 'required', Rule::in(RecurringEntry::FREQUENCIES)],
            'next_date'       => ['sometimes', 'required', 'date_format:Y-m-d'],
            'active'          => ['sometimes', 'boolean'],
        ];
    }
}
