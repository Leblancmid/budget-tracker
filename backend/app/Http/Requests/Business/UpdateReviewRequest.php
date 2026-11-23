<?php

namespace App\Http\Requests\Business;

use App\Services\Reviews;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Approve a buyer's review for the website, hide it, or put it back to waiting. */
class UpdateReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // the route already needs the Storefront
    }

    public function rules(): array
    {
        return ['status' => ['required', Rule::in(Reviews::STATUSES)]];
    }
}
