<?php

namespace App\Http\Requests\Business;

use App\Services\PriceGuide;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PriceGuideRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'level'      => ['nullable', 'integer', 'min:1', 'max:9999'],
            'class'      => ['nullable', Rule::in(PriceGuide::CLASSES)],
            // The account being edited, so it isn't compared with itself
            'exclude_id' => ['nullable', 'integer'],
        ];
    }
}
