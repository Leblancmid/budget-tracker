<?php

namespace App\Http\Requests\Business;

use Illuminate\Foundation\Http\FormRequest;

/** Marking a sale sold, optionally saying who bought it. */
class MarkSoldRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['sold_to' => ['nullable', 'string', 'max:100']];
    }
}
