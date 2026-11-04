<?php

namespace App\Http\Requests\Rucoy;

use App\Http\Requests\Rucoy\Concerns\ValidatesListing;
use App\Models\RucoyAccount;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateRucoyAccountRequest extends FormRequest
{
    use ValidatesListing;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * Once an account has payments, Pay decides its cost: it can't become a cash deal and its
     * Cost (G), the total the payments fill, is fixed (remove the payments first to change it).
     * Re-sending the same value is fine.
     */
    public function after(): array
    {
        return [function (Validator $v) {
            $account = $this->route('rucoyAccount');
            if (! $account instanceof RucoyAccount || ! $account->payments()->exists()) {
                return;
            }
            if ($this->input('deal_type') === 'cash') {
                $v->errors()->add('deal_type', 'This account has gold payments. Remove them with Pay before switching it to cash.');
            }
            if ($this->has('cost') && (float) $this->input('cost') !== (float) $account->cost) {
                $v->errors()->add('cost', 'This account has payments, so its Cost (G) is fixed. Remove them with Pay to change it.');
            }
        }];
    }

    public function rules(): array
    {
        return [
            'description' => ['sometimes', 'required', 'string', 'max:255'],
            'email'       => ['sometimes', 'required', 'string', 'max:255'],
            'avatar'      => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
            'price'          => ['nullable', 'numeric', 'min:0'],
            'cost'           => ['nullable', 'numeric', 'min:0'],
            'payment_status' => ['nullable', 'in:not_paid,partially_paid,fully_paid'],
            'payment_date'   => ['nullable', 'date'],
            ...$this->listingRules(),
        ];
    }
}
