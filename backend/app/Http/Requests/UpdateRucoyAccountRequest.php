<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRucoyAccountRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'description' => ['nullable', 'string', 'max:255'],
            'email'       => ['sometimes', 'required', 'string', 'max:255'],
            'avatar'      => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
            'price'          => ['nullable', 'numeric', 'min:0'],
            'cost'           => ['nullable', 'numeric', 'min:0'],
            'payment_status' => ['nullable', 'in:not_paid,partially_paid,fully_paid'],
        ];
    }
}
