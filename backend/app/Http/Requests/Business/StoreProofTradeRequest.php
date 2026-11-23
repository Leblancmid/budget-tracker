<?php

namespace App\Http\Requests\Business;

use App\Models\ProofTrade;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** A proven trade for the website: what it was, its value, when, a quote, and screenshots. */
class StoreProofTradeRequest extends FormRequest
{
    /** Screenshots per upload, and the size each may be */
    public const MAX_IMAGES = 20;

    public const MAX_KB = 10 * 1024;

    public function authorize(): bool
    {
        return true; // the route already needs the Storefront
    }

    public function rules(): array
    {
        return self::fields('required') + self::imageRules('nullable');
    }

    /** Shared with the update request, where every field is optional */
    public static function fields(string $presence): array
    {
        return [
            'title'     => [$presence, 'string', 'max:80'],
            'value'     => [$presence, 'numeric', 'min:0', 'max:1000000000'],
            'currency'  => ['sometimes', Rule::in(ProofTrade::CURRENCIES)],
            'traded_on' => ['sometimes', 'nullable', 'date_format:Y-m-d', 'before_or_equal:today'],
            'quote'     => ['sometimes', 'nullable', 'string', 'max:300'],
            'quote_by'  => ['sometimes', 'nullable', 'string', 'max:40'],
            'published' => ['sometimes', 'boolean'],
        ];
    }

    /** The uploaded file names are never used: each is re-encoded under a random name */
    public static function imageRules(string $presence): array
    {
        return [
            'images'   => [$presence, 'array', 'max:' . self::MAX_IMAGES],
            'images.*' => ['file', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:' . self::MAX_KB],
        ];
    }
}
