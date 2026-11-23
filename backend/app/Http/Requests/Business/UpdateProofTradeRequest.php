<?php

namespace App\Http\Requests\Business;

use Illuminate\Foundation\Http\FormRequest;

/** Change a proven trade: any of its fields (only what's sent changes). */
class UpdateProofTradeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // the route already needs the Storefront
    }

    public function rules(): array
    {
        return StoreProofTradeRequest::fields('sometimes');
    }
}
