<?php

namespace App\Http\Requests\Master;

use App\Models\BalanceAccount;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBalanceAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return self::accountRules('required');
    }

    /** Shared with the update request, which makes every field optional. */
    public static function accountRules(string $presence): array
    {
        return [
            'name'     => [$presence, 'string', 'max:100'],
            'currency' => [$presence, Rule::in(BalanceAccount::CURRENCIES)],
            'color'    => [$presence, 'string', 'max:20', 'regex:/^[a-z]+$/'],
            'icon'     => [$presence, 'string', 'max:30', 'regex:/^[a-z0-9-]+$/'],
        ];
    }
}
