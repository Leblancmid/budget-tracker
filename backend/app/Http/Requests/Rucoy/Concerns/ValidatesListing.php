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
