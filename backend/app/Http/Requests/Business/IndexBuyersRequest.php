<?php

namespace App\Http\Requests\Business;

use Illuminate\Foundation\Http\FormRequest;

class IndexBuyersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // the route already needs Trading
    }

    public function rules(): array
    {
        return [
            'q'        => ['nullable', 'string', 'max:100'],
            'sort'     => ['nullable', 'in:recent,purchases,total'],
            'page'     => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:50'],
        ];
    }
}
