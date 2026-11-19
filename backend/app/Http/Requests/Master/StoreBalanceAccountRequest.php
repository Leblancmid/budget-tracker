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
            // A credit card needs its limit
            'kind'         => ['sometimes', Rule::in(BalanceAccount::KINDS)],
            'credit_limit' => ['nullable', 'required_if:kind,credit', 'numeric', 'gt:0', 'max:1000000000'],
            'color'    => [$presence, 'string', 'max:20', 'regex:/^[a-z]+$/'],
            'icon'     => [$presence, 'string', 'max:30', 'regex:/^[a-z0-9-]+$/'],
            // Optional: % a year, credited daily; and the % withheld as tax (20% in PH banks)
            'interest_rate' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:100'],
            'interest_tax'  => ['sometimes', 'numeric', 'min:0', 'max:100'],
        ];
    }

    /**
     * Keep the fields that don't fit the kind out: a card earns no interest, a wallet has no limit.
     * $current is the account being edited (its kind applies when the request doesn't change it).
     */
    public static function fitKind(array $data, ?BalanceAccount $current = null): array
    {
        $kind = $data['kind'] ?? $current?->kind ?? 'wallet';
        if ($kind === 'credit') {
            $data['interest_rate'] = null;
            $data['interest_credited_through'] = null;
        } elseif (array_key_exists('kind', $data) || array_key_exists('credit_limit', $data)) {
            $data['credit_limit'] = null;
        }

        return $data;
    }
}
