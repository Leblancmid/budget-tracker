<?php

namespace App\Http\Requests\Profile;

use App\Http\Requests\Users\NormalizesUserInput;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Your own name and email. Send only what changed; the rest is left as it is. */
class UpdateProfileRequest extends FormRequest
{
    use NormalizesUserInput;

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name'  => ['sometimes', 'required', 'string', 'max:100'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($this->user()->id)],
        ];
    }
}
