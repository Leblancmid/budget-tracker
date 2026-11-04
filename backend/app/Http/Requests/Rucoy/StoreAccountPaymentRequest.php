<?php

namespace App\Http\Requests\Rucoy;

use App\Models\AccountPayment;
use App\Models\BalanceAccount;
use App\Models\BusinessTransaction;
use App\Models\RucoyAccount;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreAccountPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // admin-only route group
    }

    public function rules(): array
    {
        return [
            'method'          => ['required', Rule::in(AccountPayment::METHODS)],
            'gold'            => ['required', 'numeric', 'min:1', 'max:999999999999'],
            'date'            => ['required', 'date_format:Y-m-d'],
            'note'            => ['nullable', 'string', 'max:255'],
            'source_trade_id' => ['required_if:method,gold_trade', 'nullable', 'integer'],
            'balance_account' => ['required_if:method,cash', 'nullable', 'string', 'max:50'],
            'cash_amount'     => ['required_if:method,cash', 'nullable', 'numeric', 'min:0.01', 'max:99999999'],
            'php_rate'        => ['nullable', 'numeric', 'min:0.0001', 'max:100000'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $v) {
            if ($v->errors()->isNotEmpty()) {
                return;
            }
            /** @var RucoyAccount $account */
            $account = $this->route('rucoyAccount');
            $gold    = (float) $this->input('gold');

            if ($account->isCash()) {
                $v->errors()->add('method', 'This is a cash deal: its price and cost are entered as cash in Edit Account.');

                return;
            }

            // Can't pay more gold than the agreed cost still owed
            if ($account->cost !== null) {
                $owed = (float) $account->cost - (float) $account->payments()->sum('gold');
                if ($gold > $owed) {
                    $v->errors()->add('gold', 'Only ' . number_format(max($owed, 0)) . ' G is left to pay on this account.');
                }
            }

            if ($this->input('method') === 'gold_trade') {
                $trade = BusinessTransaction::find($this->input('source_trade_id'));
                if (! $trade || $trade->type !== 'gold' || $trade->archived_at !== null) {
                    $v->errors()->add('source_trade_id', 'Pick a pending gold trade.');
                } elseif ($gold > (float) $trade->price_gold) {
                    $v->errors()->add('gold', 'That trade only has ' . number_format((float) $trade->price_gold) . ' G.');
                } elseif ($trade->cost_php === null) {
                    $v->errors()->add('source_trade_id', 'This trade has no cost rates yet, so its cost in ₱ is unknown. Add them in Edit Gold first.');
                }
            } else {
                $wallet = BalanceAccount::where('code', $this->input('balance_account'))->first();
                if (! $wallet) {
                    $v->errors()->add('balance_account', 'Pick a Balance wallet.');
                } elseif ($wallet->currency !== 'PHP' && ! $this->filled('php_rate')) {
                    $v->errors()->add('php_rate', "Enter the ₱ rate for {$wallet->currency}.");
                }
            }
        }];
    }
}
