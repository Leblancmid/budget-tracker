<?php

namespace App\Http\Requests\Business;

use Illuminate\Foundation\Http\FormRequest;

/** More screenshots for a proven trade. */
class AddProofImagesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // the route already needs the Storefront
    }

    public function rules(): array
    {
        return StoreProofTradeRequest::imageRules('required');
    }
}
