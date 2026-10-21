<?php

namespace App\Http\Requests\Rucoy;

use Illuminate\Foundation\Http\FormRequest;

class AdjustGoldRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'actual'      => ['required', 'numeric'],
            'description' => ['nullable', 'string', 'max:255'],
        ];
    }
}
