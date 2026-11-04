<?php

namespace App\Http\Requests\Rucoy\Concerns;

use App\Models\RucoyAccount;
use Illuminate\Validation\Rule;

/** Listing fields shared by the create and update account requests. */
trait ValidatesListing
{
    protected function listingRules(): array
    {
        $stat = ['nullable', 'integer', 'min:0', 'max:9999'];

        return [
            // Gold deal (price/cost in G) or cash deal (price_cash/cost_cash in PHP or USD)
            'deal_type'         => ['sometimes', Rule::in(RucoyAccount::DEAL_TYPES)],
            'price_cash'        => ['nullable', 'numeric', 'min:0', 'max:9999999999'],
            'cost_cash'         => ['nullable', 'numeric', 'min:0', 'max:9999999999'],
            'cash_currency'     => ['nullable', 'required_if:deal_type,cash', Rule::in(['PHP', 'USD'])],
            'level'             => ['nullable', 'integer', 'min:1', 'max:9999'],
            'melee'             => $stat,
            'distance'          => $stat,
            'magic'             => $stat,
            'defense'           => $stat,
            // Empty (sent as '') clears them
            'accessories'       => ['nullable', 'array', 'max:' . count(RucoyAccount::ACCESSORIES)],
            'accessories.*'     => ['distinct', Rule::in(RucoyAccount::ACCESSORIES)],
            // Game screenshots are large PNGs; the stored name is generated, never the client's
            'screenshot'        => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
            'remove_screenshot' => ['sometimes', 'boolean'],
            'show_price'        => ['sometimes', 'boolean'],
            'listed_at'         => ['nullable', 'date'],
        ];
    }
}
