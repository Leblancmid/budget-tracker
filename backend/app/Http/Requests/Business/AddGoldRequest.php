<?php

namespace App\Http\Requests\Business;

use App\Http\Requests\Business\Concerns\ValidatesWalletPayment;
use App\Models\BusinessTransaction;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class AddGoldRequest extends FormRequest
{
    use ValidatesWalletPayment;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'price_gold'  => ['nullable', 'numeric', 'min:0'],
            'cost_gold'   => ['nullable', 'numeric', 'min:0'],
            // Trades whose cost was paid in ₱: the extra ₱ paid for the added gold
            'cost_php'    => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string', 'max:255'],
            ...$this->walletRules(),
        ];
    }

    public function after(): array
    {
        return [function (Validator $v) {
            $trade = $this->route('businessTransaction');
            if (! $trade instanceof BusinessTransaction) {
                return;
            }
            $addCost    = (float) $this->input('cost_gold', 0);
            $addCostPhp = (float) $this->input('cost_php', 0);

            // A trade's cost is either gold or ₱ paid, never both
            if ($trade->costPaidInPhp() && $addCost > 0) {
                $v->errors()->add('cost_gold', 'This trade was paid in ₱: add the extra ₱ paid instead of cost gold.');
            } elseif (! $trade->costPaidInPhp() && $addCostPhp > 0) {
                $v->errors()->add('cost_php', 'This trade\'s cost is in gold: add cost gold instead.');
            }

            // The added cost is bought at the trade's own rates (or is the ₱ paid)
            $this->checkWalletPayment($v, $trade, $addCost > 0 ? $addCost : ($addCostPhp > 0 ? (float) $this->input('price_gold', 0) : 0), $addCostPhp > 0 ? $addCostPhp : null);
        }];
    }
}
