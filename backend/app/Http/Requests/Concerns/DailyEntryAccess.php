<?php

namespace App\Http\Requests\Concerns;

use Illuminate\Validation\Rule;

/**
 * What a daily entry may touch beyond your own expenses: linking it to a wallet moves money in the
 * shared wallets (needs Wallets), and marking it "business" counts it in the business totals
 * (needs Trading). Without that access the field must be left out.
 */
trait DailyEntryAccess
{
    protected function accessRules(): array
    {
        $user = $this->user();

        return [
            'scope' => ['sometimes', Rule::in($user?->canUse('trading') ? ['personal', 'business'] : ['personal'])],
            // Daily amounts are in ₱, so only PHP balance accounts can be linked
            'balance_account' => $user?->canUse('wallets')
                ? ['nullable', 'string', Rule::exists('balance_accounts', 'code')->where('currency', 'PHP')]
                : ['prohibited'],
        ];
    }
}
