<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRucoyAccountRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'description' => ['nullable', 'string', 'max:255'],
            'email'       => ['required', 'string', 'max:255'],
            'avatar'      => ['nullable', 'string', 'max:500'],
        ];
    }
}
