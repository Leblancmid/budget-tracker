<?php

namespace App\Http\Requests\Master;

use App\Models\BalanceAccount;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreBalanceTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // admin-only route group
    }

    public function rules(): array
    {
        $account = Rule::exists('balance_accounts', 'code');

        return [
            'from_account' => ['required', 'string', $account],
            'to_account'   => ['required', 'string', $account, 'different:from_account'],
            'amount'       => ['required', 'numeric', 'min:0.01', 'max:999999999'],
            'received'     => ['nullable', 'numeric', 'min:0.01', 'max:999999999'],
            'fee'          => ['nullable', 'numeric', 'min:0', 'max:999999999'],
            'date'         => ['required', 'date_format:Y-m-d'],
            'note'         => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return ['to_account.different' => 'Pick a different account to send to.'];
    }

    /** Across currencies (e.g. PayPal $ → GCash ₱) the amount that arrived is needed. */
    public function after(): array
    {
        return [function (Validator $v) {
            if ($v->errors()->isNotEmpty()) {
                return;
            }
            $from = BalanceAccount::where('code', $this->input('from_account'))->value('currency');
            $to   = BalanceAccount::where('code', $this->input('to_account'))->value('currency');
            if ($from !== $to && ! $this->filled('received')) {
                $v->errors()->add('received', "Enter how much arrived in {$to}.");
            }
        }];
    }
}
